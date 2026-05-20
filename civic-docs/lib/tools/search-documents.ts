import type Anthropic from "@anthropic-ai/sdk";
import { pool } from "../db";
import { embed } from "../embed";

export const searchDocumentsTool: Anthropic.Tool = {
  name: "search_documents",
  description: `Semantic search over the full text of every public record
in the corpus. Returns the most relevant passages with their document
title, page, and a snippet. Use for narrative or interpretive
questions like "what does the strategic plan say about housing" or
"are there clauses about indemnification".`,
  input_schema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "The semantic query to search for.",
      },
      doc_type: {
        type: "string",
        enum: ["contract", "plan", "budget", "minutes"],
        description: "Optional: restrict to one document type.",
      },
      limit: {
        type: "integer",
        description: "Max number of passages to return (1-10). Default 5.",
      },
    },
    required: ["query"],
  },
};

export async function runSearchDocuments(input: {
  query: string;
  doc_type?: string;
  limit?: number;
}): Promise<string> {
  const limit = Math.min(Math.max(input.limit ?? 5, 1), 10);
  const [queryEmbedding] = await embed([input.query], "query");
  if (!queryEmbedding) {
    return JSON.stringify({ error: "Failed to embed query." });
  }
  const params: unknown[] = [JSON.stringify(queryEmbedding), limit];
  let typeClause = "";
  if (input.doc_type) {
    params.push(input.doc_type);
    typeClause = `AND d.doc_type = $${params.length}`;
  }
  const res = await pool.query(
    `SELECT d.id            AS document_id,
            d.title         AS document_title,
            d.doc_type      AS doc_type,
            c.page          AS page,
            c.content       AS content,
            1 - (c.embedding <=> $1::vector) AS similarity
       FROM document_chunks c
       JOIN documents d ON d.id = c.document_id
      WHERE c.embedding IS NOT NULL ${typeClause}
      ORDER BY c.embedding <=> $1::vector
      LIMIT $2`,
    params,
  );
  return JSON.stringify({ passages: res.rows });
}
