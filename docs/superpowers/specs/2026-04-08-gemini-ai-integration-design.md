# Gemini AI Integration Design

**Date:** 2026-04-08  
**Status:** Approved

---

## Overview

Wire up Google Gemini (free tier) to generate AI summaries for individual video transcripts (video page) and synthesized thesis analysis across all project videos (thesis page). Generation happens server-side in React Router loaders, with skeleton UI during navigation.

---

## Goals

- Replace placeholder content in the video page Summary tab with a real AI-generated summary
- Replace placeholder content on the thesis page with a real AI-generated thesis synthesis
- Keep the existing architecture patterns (loaders, in-memory store, SSR)
- Use Gemini free tier — no cost, no credit card required beyond a Google account

---

## Non-Goals

- Mind Map and Explainer tabs remain as placeholders
- No caching of AI responses (in-memory store is ephemeral anyway)
- No streaming (full response before page render)
- No user-facing prompt customization

---

## New Files

### `app/lib/ai.ts`

Wraps `@google/genai`. Exports two async functions consumed by loaders.

**Environment variable:** `GEMINI_API_KEY` — read server-side only, never sent to the client.

Types imported from existing modules:
- `TranscriptChunk` from `app/lib/transcript.ts` — shape: `{ text: string; offset: number; duration: number }`
- `Video` from `app/lib/store.ts` — shape: `{ id, title, url, videoId, transcript: TranscriptChunk[], createdAt }`

**`generateVideoSummary(transcript: TranscriptChunk[]): Promise<string>`**
- Joins all transcript chunks into plain text: `transcript.map(c => c.text).join(" ")`
- Calls Gemini with the video summary prompt (see Prompts section)
- Returns the raw markdown string from Gemini

**`generateThesis(videos: Video[]): Promise<string>`**
- Concatenates transcripts across all videos, each prefixed with: `## Source: {video.title}\n\n{transcript_text}`
- Calls Gemini with the thesis prompt (see Prompts section)
- Returns the raw markdown string from Gemini

Both functions throw on API error — callers handle gracefully by returning an error string.

---

## Modified Files

### `app/routes/video.tsx`

**Loader change:**
```ts
const [result, summary] = await Promise.all([
  getVideoOrThrow(params),
  generateVideoSummary(video.transcript).catch(() => "Failed to generate summary.")
]);
return { ...result, summary };
```

**Summary tab change:**
- Replaces lorem ipsum with `<div dangerouslySetInnerHTML={{ __html: marked(summary) }} />`
- While `useNavigation().state === "loading"`, renders `<SummarySkeleton />` instead

### `app/routes/thesis.tsx`

**Loader change:**
```ts
const project = getProjectOrThrow(params);
const thesis = await generateThesis(project.videos).catch(() => "Failed to generate thesis.");
return { project, thesis };
```

**Page change:**
- Replaces all four hardcoded sections with `<div dangerouslySetInnerHTML={{ __html: marked(thesis) }} />`
- While `useNavigation().state === "loading"`, renders `<ThesisSkeleton />`

---

## Skeleton UI

A reusable `<Skeleton />` component renders animated grey bars to indicate loading. Used in both the Summary tab and the thesis page body.

```tsx
// Pulse animation via inline keyframes or Tailwind animate-pulse
function Skeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {[100, 90, 95, 85, 92].map((w, i) => (
        <div key={i} style={{
          height: 14,
          width: `${w}%`,
          backgroundColor: "#e5e5e5",
          borderRadius: 4,
          animation: "pulse 1.5s ease-in-out infinite"
        }} />
      ))}
    </div>
  );
}
```

The skeleton is shown using React Router's `useNavigation` hook. Condition: `navigation.state === "loading" && navigation.location?.pathname === currentPathname`. This ensures the skeleton only appears when navigating to this specific page, not when navigating away to a sibling route.

---

## Prompts

### Video Summary Prompt

```
Generate a professional, credible summary of the following content. The output must be strictly grounded in the source—no fabrication.

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
{transcript_text}
```

### Thesis Prompt

```
You are analyzing multiple video transcripts from an investment research project. Generate a professional, credible thesis synthesis grounded strictly in the provided sources—no fabrication.

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
{combined_transcripts}
```

---

## Dependencies

- `@google/genai` — official Google Generative AI SDK (npm package)
- `marked` — markdown to HTML converter

Both are production dependencies.

---

## Environment Setup

User must set `GEMINI_API_KEY` in a `.env` file at the project root:
```
GEMINI_API_KEY=your_key_here
```

React Router dev server reads `.env` automatically via Vite.

---

## Error Handling

- If Gemini call fails (network error, quota exceeded, etc.), the loader catches the error and returns a fallback string: `"Failed to generate summary. Please try again."` for the video page, and `"Failed to generate thesis. Please try again."` for the thesis page.
- The page renders this string as plain text — no crash, no blank panel.

---

## Gemini Model

Use `gemini-1.5-flash` — free tier, fast, sufficient context window for long transcripts (~1M tokens).
