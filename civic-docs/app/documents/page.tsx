import { pool } from "@/lib/db";

export const dynamic = "force-dynamic";

type DocumentRow = {
  id: string;
  title: string;
  doc_type: string;
  ingested_at: Date;
  page_count: number | null;
};

async function listDocuments(): Promise<DocumentRow[]> {
  try {
    const res = await pool.query<DocumentRow>(
      `SELECT id, title, doc_type, ingested_at, page_count
         FROM documents
        ORDER BY ingested_at DESC
        LIMIT 200`,
    );
    return res.rows;
  } catch {
    return [];
  }
}

export default async function DocumentsPage() {
  const docs = await listDocuments();

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
      <p className="mt-2 text-sm text-zinc-500">
        {docs.length === 0
          ? "No documents have been ingested yet. Run `npm run ingest -- <file>` to add one."
          : `${docs.length} document${docs.length === 1 ? "" : "s"} on file.`}
      </p>

      {docs.length > 0 && (
        <table className="mt-6 w-full text-sm border-collapse">
          <thead className="text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th className="py-2 pr-4">Title</th>
              <th className="py-2 pr-4">Type</th>
              <th className="py-2 pr-4">Pages</th>
              <th className="py-2 pr-4">Added</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d.id} className="border-b border-zinc-100 dark:border-zinc-900">
                <td className="py-2 pr-4">{d.title}</td>
                <td className="py-2 pr-4 capitalize">{d.doc_type}</td>
                <td className="py-2 pr-4">{d.page_count ?? "—"}</td>
                <td className="py-2 pr-4 text-zinc-500">
                  {new Date(d.ingested_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
