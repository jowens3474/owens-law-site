-- Civic Docs schema. Run against a Postgres instance with pgvector installed.
-- Embedding dimension matches Voyage's `voyage-3` model (1024).

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS documents (
  id            BIGSERIAL PRIMARY KEY,
  title         TEXT NOT NULL,
  doc_type      TEXT NOT NULL CHECK (doc_type IN ('contract', 'plan', 'budget', 'minutes')),
  source_url    TEXT,
  file_path     TEXT,
  page_count    INT,
  ingested_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_text      TEXT
);

CREATE INDEX IF NOT EXISTS documents_doc_type_idx ON documents (doc_type);

CREATE TABLE IF NOT EXISTS contracts (
  document_id        BIGINT PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
  vendor_name        TEXT,
  total_value_cents  BIGINT,
  start_date         DATE,
  end_date           DATE,
  department         TEXT,
  services_summary   TEXT,
  extracted_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  extraction_model   TEXT
);

CREATE INDEX IF NOT EXISTS contracts_vendor_idx     ON contracts (vendor_name);
CREATE INDEX IF NOT EXISTS contracts_department_idx ON contracts (department);
CREATE INDEX IF NOT EXISTS contracts_value_idx      ON contracts (total_value_cents);

CREATE TABLE IF NOT EXISTS document_chunks (
  id           BIGSERIAL PRIMARY KEY,
  document_id  BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_idx    INT NOT NULL,
  page         INT,
  content      TEXT NOT NULL,
  embedding    vector(1024),
  UNIQUE (document_id, chunk_idx)
);

CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx
  ON document_chunks USING hnsw (embedding vector_cosine_ops);
