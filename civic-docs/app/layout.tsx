import type { Metadata } from "next";
import Link from "next/link";
import { entity } from "@/lib/config";
import "./globals.css";

export const metadata: Metadata = {
  title: `${entity.name} — Public Records`,
  description: `Search and ask questions about public records released by ${entity.name}.`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <header className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="font-semibold tracking-tight">
              {entity.name}
            </Link>
            <nav className="flex gap-6 text-sm">
              <Link href="/chat" className="hover:underline">Ask</Link>
              <Link href="/documents" className="hover:underline">Documents</Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-zinc-200 dark:border-zinc-800">
          <div className="max-w-5xl mx-auto px-6 py-4 text-xs text-zinc-500">
            An independent transparency tool. Records were obtained via public records requests.
          </div>
        </footer>
      </body>
    </html>
  );
}
