import { NextResponse } from "next/server";
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
    return NextResponse.json({ error: "messages required" }, { status: 400 });
  }

  const conversation: Anthropic.MessageParam[] = [...body.messages];
  const trace: Array<{ type: string; detail?: unknown }> = [];

  for (let step = 0; step < 6; step++) {
    const response = await anthropic.messages.create({
      model: CHAT_MODEL,
      max_tokens: 16000,
      system: buildSystemPrompt(),
      tools,
      messages: conversation,
    });

    conversation.push({ role: "assistant", content: response.content });

    if (response.stop_reason === "end_turn" || response.stop_reason === "max_tokens") {
      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n\n");
      return NextResponse.json({
        message: { role: "assistant", content: response.content },
        text,
        trace,
        stop_reason: response.stop_reason,
        usage: response.usage,
      });
    }

    if (response.stop_reason !== "tool_use") {
      return NextResponse.json({
        error: `Unexpected stop_reason: ${response.stop_reason}`,
        trace,
      }, { status: 500 });
    }

    const toolUses = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
    );

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const t of toolUses) {
      trace.push({ type: "tool_use", detail: { name: t.name, input: t.input } });
      const result = await executeTool(t.name, t.input);
      trace.push({ type: "tool_result", detail: { name: t.name, result } });
      toolResults.push({ type: "tool_result", tool_use_id: t.id, content: result });
    }

    conversation.push({ role: "user", content: toolResults });
  }

  return NextResponse.json({ error: "Exceeded tool-use step budget", trace }, { status: 500 });
}
