"use client";

import { useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
  toolCalls?: Array<{ name: string; input: unknown }>;
};

type StreamEvent =
  | { type: "text_delta"; delta: string }
  | { type: "tool_use"; id: string; name: string; input: unknown }
  | { type: "tool_result"; id: string; name: string }
  | { type: "done"; stop_reason: string; usage: unknown }
  | { type: "error"; message: string };

async function* readNDJSON(res: Response): AsyncGenerator<StreamEvent> {
  if (!res.body) return;
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf("\n")) !== -1) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (line) yield JSON.parse(line) as StreamEvent;
    }
  }
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const next: ChatMessage[] = [
      ...messages,
      { role: "user", text },
      { role: "assistant", text: "", toolCalls: [] },
    ];
    setMessages(next);
    setInput("");
    setLoading(true);
    setStatus(null);
    setError(null);

    try {
      const apiMessages = next
        .slice(0, -1)
        .map((m) => ({ role: m.role, content: m.text }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }

      for await (const event of readNDJSON(res)) {
        if (event.type === "text_delta") {
          setMessages((prev) => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (last?.role === "assistant") {
              copy[copy.length - 1] = { ...last, text: last.text + event.delta };
            }
            return copy;
          });
        } else if (event.type === "tool_use") {
          setStatus(`Running ${event.name}…`);
          setMessages((prev) => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (last?.role === "assistant") {
              copy[copy.length - 1] = {
                ...last,
                toolCalls: [...(last.toolCalls ?? []), { name: event.name, input: event.input }],
              };
            }
            return copy;
          });
        } else if (event.type === "tool_result") {
          setStatus(null);
        } else if (event.type === "error") {
          setError(event.message);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
      setStatus(null);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Ask the records</h1>

      <div className="flex flex-col gap-4">
        {messages.length === 0 && (
          <p className="text-sm text-zinc-500">
            Ask anything about the public records on file. Answers cite their source.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className="flex flex-col gap-1">
            <div
              className={
                m.role === "user"
                  ? "self-end max-w-[80%] rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-4 py-2 text-sm"
                  : "self-start max-w-[90%] rounded-lg bg-zinc-100 dark:bg-zinc-900 px-4 py-3 text-sm whitespace-pre-wrap"
              }
            >
              {m.text || (m.role === "assistant" && loading ? "…" : "")}
            </div>
            {m.toolCalls && m.toolCalls.length > 0 && (
              <div className="self-start text-xs text-zinc-500 pl-2">
                {m.toolCalls.map((t, j) => (
                  <div key={j}>called {t.name}</div>
                ))}
              </div>
            )}
          </div>
        ))}
        {status && <div className="self-start text-sm text-zinc-500">{status}</div>}
        {error && <div className="self-start text-sm text-red-600">{error}</div>}
      </div>

      <form onSubmit={onSubmit} className="flex gap-2 sticky bottom-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about the records…"
          className="flex-1 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-black px-4 py-2 text-sm"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-md bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
