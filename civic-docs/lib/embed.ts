import { VoyageAIClient } from "voyageai";

const voyage = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY });

const MODEL = "voyage-3";

export async function embed(
  inputs: string[],
  inputType: "document" | "query",
): Promise<number[][]> {
  if (inputs.length === 0) return [];
  const res = await voyage.embed({
    input: inputs,
    model: MODEL,
    inputType,
  });
  return (res.data ?? []).map((d) => d.embedding ?? []);
}
