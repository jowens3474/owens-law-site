/**
 * Ingest one document (PDF, TXT, or MD) into the database.
 *
 *   npm run ingest -- <path> --type=contract --title="Some title"
 *
 *   --type   contract | plan | budget | minutes
 *   --title  optional override; defaults to the filename
 *   --url    optional source URL
 *
 * The script:
 *   1. extracts text (PDF via pdf-parse; .txt/.md pass through)
 *   2. inserts a row into `documents`
 *   3. chunks the text, embeds with Voyage, inserts into `document_chunks`
 *   4. if --type=contract, asks Claude to extract structured fields and
 *      inserts a row into `contracts`
 */

import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { embed } from "@/lib/embed";

const DOC_TYPES = ["contract", "plan", "budget", "minutes"] as const;
type DocType = (typeof DOC_TYPES)[number];

type Args = { file: string; type: DocType; title?: string; url?: string };

function parseArgs(argv: string[]): Args {
  const positional = argv.filter((a) => !a.startsWith("--"));
  const flags = Object.fromEntries(
    argv
      .filter((a) => a.startsWith("--"))
      .map((a) => {
        const [k, ...rest] = a.slice(2).split("=");
        return [k, rest.join("=")];
      }),
  );
  const file = positional[0];
  const type = flags.type as DocType | undefined;
  if (!file) throw new Error("Usage: ingest <path> --type=<contract|plan|budget|minutes>");
  if (!type || !DOC_TYPES.includes(type)) {
    throw new Error(`--type must be one of: ${DOC_TYPES.join(", ")}`);
  }
  return { file, type, title: flags.title, url: flags.url };
}

async function extractText(file: string): Promise<{ text: string; pages: number | null }> {
  const ext = path.extname(file).toLowerCase();
  const bytes = await fs.readFile(file);
  if (ext === ".pdf") {
    const { default: pdfParse } = await import("pdf-parse");
    const parsed = await pdfParse(bytes);
    return { text: parsed.text, pages: parsed.numpages };
  }
  return { text: bytes.toString("utf-8"), pages: null };
}

function chunkText(text: string, target = 1200, overlap = 200): string[] {
  const clean = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (clean.length <= target) return [clean];
  const chunks: string[] = [];
  let i = 0;
  while (i < clean.length) {
    const end = Math.min(clean.length, i + target);
    let cut = end;
    if (end < clean.length) {
      const para = clean.lastIndexOf("\n\n", end);
      if (para > i + target / 2) cut = para;
    }
    chunks.push(clean.slice(i, cut).trim());
    if (cut >= clean.length) break;
    i = Math.max(0, cut - overlap);
  }
  return chunks.filter((c) => c.length > 0);
}

const contractSchema = z.object({
  vendor_name: z.string().nullable(),
  total_value_cents: z.number().int().nullable(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  department: z.string().nullable(),
  services_summary: z.string().nullable(),
});

async function extractContractFields(
  anthropic: Anthropic,
  text: string,
): Promise<z.infer<typeof contractSchema>> {
  const excerpt = text.length > 60000 ? text.slice(0, 60000) : text;
  const response = await anthropic.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 1024,
    system:
      "Extract structured fields from a government contract. Return JSON matching the provided schema. Use null for any field you cannot confidently determine. Money must be in cents (integer). Dates must be YYYY-MM-DD.",
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            vendor_name: { type: ["string", "null"] },
            total_value_cents: { type: ["integer", "null"] },
            start_date: { type: ["string", "null"] },
            end_date: { type: ["string", "null"] },
            department: { type: ["string", "null"] },
            services_summary: { type: ["string", "null"] },
          },
          required: [
            "vendor_name",
            "total_value_cents",
            "start_date",
            "end_date",
            "department",
            "services_summary",
          ],
        },
      },
    },
    messages: [{ role: "user", content: excerpt }],
  });
  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("No text in extraction response");
  return contractSchema.parse(JSON.parse(textBlock.text));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const anthropic = new Anthropic();

  const abs = path.resolve(args.file);
  const title = args.title ?? path.basename(abs, path.extname(abs));
  console.log(`Reading ${abs}`);
  const { text, pages } = await extractText(abs);
  console.log(`  ${text.length.toLocaleString()} chars, ${pages ?? "unknown"} pages`);

  const docRes = await pool.query<{ id: string }>(
    `INSERT INTO documents (title, doc_type, source_url, file_path, page_count, raw_text)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [title, args.type, args.url ?? null, abs, pages, text],
  );
  const documentId = docRes.rows[0].id;
  console.log(`  inserted document id=${documentId}`);

  const chunks = chunkText(text);
  console.log(`  ${chunks.length} chunks, embedding…`);
  const batchSize = 16;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const vectors = await embed(batch, "document");
    for (let j = 0; j < batch.length; j++) {
      await pool.query(
        `INSERT INTO document_chunks (document_id, chunk_idx, content, embedding)
         VALUES ($1, $2, $3, $4::vector)`,
        [documentId, i + j, batch[j], JSON.stringify(vectors[j])],
      );
    }
    process.stdout.write(`  embedded ${Math.min(i + batchSize, chunks.length)}/${chunks.length}\r`);
  }
  process.stdout.write("\n");

  if (args.type === "contract") {
    console.log("  extracting contract fields…");
    const fields = await extractContractFields(anthropic, text);
    await pool.query(
      `INSERT INTO contracts (
         document_id, vendor_name, total_value_cents, start_date, end_date,
         department, services_summary, extraction_model
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        documentId,
        fields.vendor_name,
        fields.total_value_cents,
        fields.start_date,
        fields.end_date,
        fields.department,
        fields.services_summary,
        "claude-opus-4-7",
      ],
    );
    console.log("  contract fields stored:", fields);
  }

  await pool.end();
  console.log("done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
