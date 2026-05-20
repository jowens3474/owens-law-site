# Civic Docs — agent notes

## This is NOT the Next.js you know

This project uses Next.js 16 with React 19. APIs, conventions, and file
structure may differ from training data. Read `node_modules/next/dist/docs/`
before writing new Next.js code. Heed deprecation notices.

## Project shape

Public-facing transparency site that lets visitors interact with one
entity's public records (contracts, strategic plans, budgets, minutes).
Built as a hybrid RAG:

- **Structured table** (`contracts`) holds extracted fields — vendor,
  amount, term, services, department. Answers ranking/aggregation
  questions ("top revenue contract") via SQL.
- **Chunked + embedded text** (`document_chunks`) holds the full
  document body. Answers semantic questions ("what does this contract
  say about indemnification") via vector search.
- **Chat layer** (`app/api/chat/route.ts`) uses Claude with tool use —
  Claude picks between `query_contracts` (SQL) and `search_documents`
  (vector) per turn. Always cites source documents.

## MVP scope

One entity at a time, configured via env (`ENTITY_NAME`,
`ENTITY_DESCRIPTION`). Multi-tenant comes later.

## Stack

- Next.js 16 (App Router) + React 19 + Tailwind 4
- Postgres + `pgvector` (one DB for structured + embeddings)
- Anthropic SDK (`claude-opus-4-7`, adaptive thinking)
- Voyage AI for embeddings (`voyage-3`)
- Hosting target: Vercel + Neon (or any managed Postgres with pgvector)

## Don't

- Don't put `Date.now()`, request IDs, or per-user data in the system
  prompt — it kills prompt caching. See `lib/anthropic.ts` for the
  cached system prompt pattern.
- Don't call `agents.create()` per-request if/when we move to Managed
  Agents — agents are persistent, create once.
- Don't switch models mid-session — invalidates the prompt cache.
