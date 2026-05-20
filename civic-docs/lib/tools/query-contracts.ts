import type Anthropic from "@anthropic-ai/sdk";
import { pool } from "../db";

export const queryContractsTool: Anthropic.Tool = {
  name: "query_contracts",
  description: `Run a read-only SQL SELECT against the contracts table.
Use for ranking, aggregation, or filtering questions like
"top 5 contracts by value", "total spent on consulting last year", or
"all contracts with vendor X".

Schema:
  documents(id, title, doc_type, source_url, ingested_at)
  contracts(
    document_id,        -- FK to documents.id
    vendor_name,
    total_value_cents,  -- money in CENTS, convert to dollars in answers
    start_date,
    end_date,
    department,
    services_summary
  )

You may JOIN documents on contracts.document_id = documents.id to get
the document title for citations. Always include enough columns to cite
the source (document title or id).`,
  input_schema: {
    type: "object",
    properties: {
      sql: {
        type: "string",
        description:
          "A single SELECT statement. Must start with SELECT. Limit results to 50 rows or fewer.",
      },
    },
    required: ["sql"],
  },
};

export async function runQueryContracts(input: { sql: string }): Promise<string> {
  const sql = (input.sql ?? "").trim();
  if (!/^select\b/i.test(sql)) {
    return JSON.stringify({ error: "Only SELECT statements are allowed." });
  }
  if (/;.*\S/.test(sql.replace(/;\s*$/, ""))) {
    return JSON.stringify({ error: "Only a single statement is allowed." });
  }
  const client = await pool.connect();
  try {
    await client.query("SET LOCAL statement_timeout = '5s'");
    await client.query("SET LOCAL default_transaction_read_only = on");
    const res = await client.query({ text: sql, rowMode: "array" });
    const fields = res.fields.map((f) => f.name);
    const rows = res.rows.slice(0, 50);
    return JSON.stringify({ columns: fields, rows, truncated: res.rows.length > 50 });
  } catch (err) {
    return JSON.stringify({ error: err instanceof Error ? err.message : String(err) });
  } finally {
    client.release();
  }
}
