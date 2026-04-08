// app/lib/ai.ts
import { GoogleGenAI } from "@google/genai";
import type { TranscriptChunk } from "./transcript";
import type { Video } from "./store";

const VIDEO_SUMMARY_PROMPT = `Generate a professional, credible summary of the following content. The output must be strictly grounded in the source—no fabrication.

Formatting:
- Flexible structure:
  - Timeline table if chronological events exist.
  - Markdown tables for quantitative data, comparisons, or definitions.
  - Bulleted lists for clarity.
- Only include content supported by the source; omit unsupported parts.
- Bold key insights, terms, and conclusions.
- Mark uncertain info as *Not specified/Uncertain*.
- Bulleted lists should be plain text, without any timestamps or time ranges.

Length:
- Ensure the response has a minimum of 800 words.

Tone:
- Use a default tone in your response.

Content:
`;

const THESIS_PROMPT = `You are analyzing multiple video transcripts from an investment research project. Generate a professional, credible thesis synthesis grounded strictly in the provided sources—no fabrication.

Structure your response with the following sections:
- **Key Themes** — recurring ideas and frameworks across sources
- **Cross-Video Synthesis** — where sources converge and diverge
- **Contradictions Found** — direct conflicts between sources, with attribution
- **Thesis Summary** — the strongest actionable signal from the combined evidence

Formatting:
- Flexible structure:
  - Markdown tables for quantitative comparisons or side-by-side source attribution.
  - Bulleted lists for clarity.
- Only include content supported by the sources; omit unsupported parts.
- Bold key insights, terms, and conclusions.
- Mark uncertain or unattributed claims as *Not specified/Uncertain*.
- Bulleted lists should be plain text, without any timestamps or time ranges.

Length:
- Ensure the response has a minimum of 800 words.

Tone:
- Use a default tone in your response.

Sources:
`;

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  return new GoogleGenAI({ apiKey });
}

export async function generateVideoSummary(
  transcript: TranscriptChunk[]
): Promise<string> {
  const text = transcript.map((c) => c.text).join(" ");
  const client = getClient();
  const response = await client.models.generateContent({
    model: "gemma-3-27b-it",
    contents: VIDEO_SUMMARY_PROMPT + text,
  });
  return response.text ?? "";
}

export async function generateThesis(videos: Video[]): Promise<string> {
  const combined = videos
    .map(
      (v) =>
        `## Source: ${v.title}\n\n${v.transcript.map((c) => c.text).join(" ")}`
    )
    .join("\n\n---\n\n");
  const client = getClient();
  const response = await client.models.generateContent({
    model: "gemma-3-27b-it",
    contents: THESIS_PROMPT + combined,
  });
  return response.text ?? "";
}
