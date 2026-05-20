# Civic Docs

A public-facing transparency site that lets visitors interact with an
entity's public records — contracts, strategic plans, budgets, and
meeting minutes obtained through public records requests. Visitors can
browse the corpus or ask questions in plain English; answers cite the
source documents.

This is the MVP scaffold: one entity at a time, hybrid retrieval
(structured SQL + semantic search), Claude for chat and extraction.

## Stack

- **Next.js 16** (App Router) + **React 19** + **Tailwind 4**
- **Postgres** + **pgvector** (one DB, structured rows + embeddings)
- **Anthropic SDK** — `claude-opus-4-7` with adaptive thinking and
  prompt caching on the system prompt
- **Voyage AI** for embeddings (`voyage-3`, 1024 dim)

## How it answers questions

Most "transparency" questions split into two shapes:

- **Structured** — *"top revenue contract"*, *"total spent on
  consulting"*, *"vendors with multiple contracts"*. These need
  aggregation, not retrieval. Stored as columns on the `contracts`
  table; answered by Claude writing SQL via the `query_contracts`
  tool.
- **Narrative** — *"what does the plan say about housing?"*,
  *"any clauses about indemnification?"*. These need semantic
  retrieval. Stored as embedded chunks; answered by Claude calling
  the `search_documents` tool.

The chat route (`app/api/chat/route.ts`) runs a tool-use loop. Every
answer cites source documents.

## Quick start (local)

```sh
# 1. Postgres with pgvector
docker run -d --name civic-pg -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres pgvector/pgvector:pg16
createdb -h localhost -U postgres civic_docs   # or psql + CREATE DATABASE

# 2. Env
cp .env.example .env
# fill in ANTHROPIC_API_KEY, VOYAGE_API_KEY, DATABASE_URL, ENTITY_NAME

# 3. Install + init
npm install
npm run db:init

# 4. Ingest a document
npm run ingest -- ./path/to/contract.pdf --type=contract --title="Acme Janitorial Services 2024"
npm run ingest -- ./path/to/plan.pdf     --type=plan
npm run ingest -- ./path/to/budget.pdf   --type=budget
npm run ingest -- ./path/to/minutes.pdf  --type=minutes

# 5. Run
npm run dev
# → http://localhost:3000
```

## File layout

```
app/
  page.tsx                  landing page (entity intro, suggested questions)
  chat/page.tsx             chat UI (client component)
  documents/page.tsx        browse all ingested documents
  api/chat/route.ts         POST endpoint — runs the Claude tool-use loop
lib/
  anthropic.ts              SDK client + cached system prompt
  db.ts                     pg pool
  embed.ts                  Voyage embedding helper
  config.ts                 entity name/description from env
  tools/
    query-contracts.ts      SQL tool (read-only SELECT)
    search-documents.ts     vector search tool
db/
  schema.sql                tables + pgvector HNSW index
scripts/
  ingest.ts                 PDF → text → chunks/embeddings → DB
                            (contracts also get Claude field extraction)
```

## Production notes

- The SQL tool is read-only via `SET LOCAL default_transaction_read_only`
  and rejects anything that doesn't start with `SELECT`. Still, run with
  a Postgres role that has `SELECT` privileges only.
- The chat endpoint has no auth (public read). The `ingest` script is
  meant to be run by an admin from a trusted environment — don't expose
  it as an endpoint without auth.
- Prompt cache is wired up on the system prompt. Confirm hits via
  `usage.cache_read_input_tokens` in the chat-route response.
- This scaffold lives inside the `owens-law-site` repo for transit only.
  Move it to its own repo (`cp -r civic-docs/ ../new-repo/`) when you
  create one.
