import type Anthropic from "@anthropic-ai/sdk";
import { anthropic, CHAT_MODEL, buildSystemPrompt } from "@/lib/anthropic";
import { queryContractsTool, runQueryContracts } from "@/lib/tools/query-contracts";
import { searchDocumentsTool, runSearchDocuments } from "@/lib/tools/search-documents";

export const runtime = "nodejs";
export const maxDuration = 60;

type ChatRequest = {
  messages: Anthropic.MessageParam[];
};

const tools: Anthropic.Tool[] = [queryContractsTool, searchDocumentsTool];

async function executeTool(name: string, input: unknown): Promise<string> {
  if (name === queryContractsTool.name) {
    return runQueryContracts(input as { sql: string });
  }
  if (name === searchDocumentsTool.name) {
    return runSearchDocuments(input as { query: string; doc_type?: string; limit?: number });
  }
  return JSON.stringify({ error: `Unknown tool: ${name}` });
}

export async function POST(req: Request) {
  const body = (await req.json()) as ChatRequest;
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return new Response(JSON.stringify({ error: "messages required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  const conversation: Anthropic.MessageParam[] = [...body.messages];

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };

      try {
        for (let step = 0; step < 6; step++) {
          const iter = anthropic.messages.stream({
            model: CHAT_MODEL,
            max_tokens: 16000,
            system: buildSystemPrompt(),
            tools,
            messages: conversation,
          });

          iter.on("text", (delta) => {
            emit({ type: "text_delta", delta });
          });

          const message = await iter.finalMessage();
          conversation.push({ role: "assistant", content: message.content });

          if (message.stop_reason === "tool_use") {
            const toolUses = message.content.filter(
              (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
            );
            const toolResults: Anthropic.ToolResultBlockParam[] = [];
            for (const t of toolUses) {
              emit({ type: "tool_use", name: t.name, input: t.input, id: t.id });
              const result = await executeTool(t.name, t.input);
              emit({ type: "tool_result", name: t.name, id: t.id });
              toolResults.push({ type: "tool_result", tool_use_id: t.id, content: result });
            }
            conversation.push({ role: "user", content: toolResults });
            continue;
          }

          emit({
            type: "done",
            stop_reason: message.stop_reason,
            usage: message.usage,
          });
          controller.close();
          return;
        }
        emit({ type: "error", message: "Exceeded tool-use step budget" });
        controller.close();
      } catch (err) {
        emit({ type: "error", message: err instanceof Error ? err.message : String(err) });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
