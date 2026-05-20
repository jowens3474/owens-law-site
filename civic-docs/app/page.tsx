import Link from "next/link";
import { entity } from "@/lib/config";

export default function Home() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">
        Public records for {entity.name}
      </h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
        {entity.description} The contracts, plans, budgets, and meeting
        minutes published here were obtained through public records
        requests. You can browse them directly, or ask questions in
        plain English.
      </p>

      <div className="mt-10 flex gap-3">
        <Link
          href="/chat"
          className="rounded-md bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-5 py-2.5 text-sm font-medium"
        >
          Ask a question
        </Link>
        <Link
          href="/documents"
          className="rounded-md border border-zinc-300 dark:border-zinc-700 px-5 py-2.5 text-sm font-medium"
        >
          Browse documents
        </Link>
      </div>

      <h2 className="mt-16 text-sm font-medium uppercase tracking-wide text-zinc-500">
        Try asking
      </h2>
      <ul className="mt-3 space-y-2 text-zinc-700 dark:text-zinc-300">
        <li>&ldquo;Which contract has the largest total value?&rdquo;</li>
        <li>&ldquo;Are there multiple vendors providing similar services?&rdquo;</li>
        <li>&ldquo;What does the strategic plan say about housing?&rdquo;</li>
        <li>&ldquo;How much did we spend on legal services last fiscal year?&rdquo;</li>
      </ul>
    </div>
  );
}
