# Gemini AI Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up Google Gemini to generate real AI summaries on the video page and thesis synthesis on the thesis page, replacing all placeholder content.

**Architecture:** A new `app/lib/ai.ts` module wraps `@google/genai` and exports two functions (`generateVideoSummary`, `generateThesis`) called from React Router loaders. Markdown output is rendered via `marked`. A reusable `Skeleton` component shows animated loading bars during navigation.

**Tech Stack:** React Router v7 (SSR), `@google/genai` (Gemini 1.5 Flash), `marked` (markdown→HTML), TypeScript, Vite (.env support)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `app/lib/ai.ts` | Create | Gemini client, prompt constants, `generateVideoSummary`, `generateThesis` |
| `app/components/skeleton.tsx` | Create | Reusable animated skeleton bar component |
| `app/routes/video.tsx` | Modify | Add `summary` to loader return, render summary markdown + skeleton |
| `app/routes/thesis.tsx` | Modify | Add `thesis` to loader return, render thesis markdown + skeleton |
| `.env` | Create (user) | `GEMINI_API_KEY=your_key_here` |

---

## Task 1: Install dependencies

**Files:**
- Modify: `package.json` (via npm)

- [ ] **Step 1: Install `@google/genai` and `marked`**

```bash
cd "c:/Users/danfr/OneDrive/Documents/Net Worth/Coding/Investment/media-analysis"
npm install @google/genai marked
npm install --save-dev @types/marked
```

Expected output: packages added to `node_modules`, `package.json` updated with `@google/genai` and `marked` in `dependencies`.

Note: `@types/marked` may show "not found" — `marked` v9+ ships its own types, so `--save-dev @types/marked` can be skipped if it errors.

- [ ] **Step 2: Verify install**

```bash
node -e "import('@google/genai').then(() => console.log('ok'))"
```

Expected: prints `ok` (or ESM resolution success).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @google/genai and marked dependencies"
```

---

## Task 2: Create `app/lib/ai.ts`

**Files:**
- Create: `app/lib/ai.ts`

- [ ] **Step 1: Create the file**

```typescript
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
    model: "gemini-1.5-flash",
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
    model: "gemini-1.5-flash",
    contents: THESIS_PROMPT + combined,
  });
  return response.text ?? "";
}
```

- [ ] **Step 2: Typecheck**

```bash
cd "c:/Users/danfr/OneDrive/Documents/Net Worth/Coding/Investment/media-analysis"
npx react-router typegen && npx tsc --noEmit
```

Expected: no errors. If `@google/genai` types error, check the installed package version — `GoogleGenAI` and `models.generateContent` are the v1 API shape. If the package uses a different export, run `node -e "const g = require('@google/genai'); console.log(Object.keys(g))"` to inspect exports and adjust import accordingly.

- [ ] **Step 3: Commit**

```bash
git add app/lib/ai.ts
git commit -m "feat: add Gemini AI client with video summary and thesis prompts"
```

---

## Task 3: Create `app/components/skeleton.tsx`

**Files:**
- Create: `app/components/skeleton.tsx`

- [ ] **Step 1: Create the file**

```tsx
// app/components/skeleton.tsx

const keyframes = `
@keyframes skeletonPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
`;

const widths = [100, 90, 95, 85, 92, 88, 96, 80];

export function Skeleton({ rows = 5 }: { rows?: number }) {
  return (
    <>
      <style>{keyframes}</style>
      <div
        style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
        role="status"
        aria-label="Loading..."
      >
        {widths.slice(0, rows).map((w, i) => (
          <div
            key={i}
            style={{
              height: 14,
              width: `${w}%`,
              backgroundColor: "#e5e5e5",
              borderRadius: 4,
              animation: "skeletonPulse 1.5s ease-in-out infinite",
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
    </>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/components/skeleton.tsx
git commit -m "feat: add reusable Skeleton loading component"
```

---

## Task 4: Update `app/routes/video.tsx`

**Files:**
- Modify: `app/routes/video.tsx`

- [ ] **Step 1: Add imports at the top of the file**

Add to the existing import block (after the existing imports):

```tsx
import { useNavigation } from "react-router";
import { marked } from "marked";
import { generateVideoSummary } from "../lib/ai";
import { Skeleton } from "../components/skeleton";
```

Note: `useNavigation` may already be imported via `react-router` — check the existing import and add only what's missing.

- [ ] **Step 2: Update the loader**

Replace the existing loader:

```ts
export async function loader({ params }: Route.LoaderArgs) {
  const result = getVideo(params.projectId, params.videoId);
  if (!result) {
    throw new Response("Video not found", { status: 404 });
  }
  const summary = await generateVideoSummary(result.video.transcript).catch(
    () => "Failed to generate summary. Please try again."
  );
  return { ...result, summary };
}
```

- [ ] **Step 3: Update `AiStudioPanel` to accept and render summary**

Replace the `AiStudioPanel` function signature and Summary tab content:

```tsx
function AiStudioPanel({ summary }: { summary: string }) {
  const [activeTab, setActiveTab] = useState<Tab>("Summary");
  const navigation = useNavigation();
  const isGenerating =
    navigation.state === "loading" &&
    navigation.location?.pathname !== undefined;
```

Then replace the Summary tab content block (the `activeTab === "Summary"` branch):

```tsx
{activeTab === "Summary" && (
  <div>
    <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, marginBottom: "0.75rem" }}>
      Summary
    </h3>
    {isGenerating ? (
      <Skeleton rows={8} />
    ) : (
      <div
        style={{ color: "#444", fontSize: "0.875rem", lineHeight: 1.7 }}
        dangerouslySetInnerHTML={{ __html: marked(summary) as string }}
      />
    )}
  </div>
)}
```

- [ ] **Step 4: Pass `summary` from page to panel**

In `VideoPage`, destructure `summary` from `useLoaderData` and pass it to `AiStudioPanel`:

```tsx
export default function VideoPage() {
  const { project, video, summary } = useLoaderData<typeof loader>();
  // ...
  // In JSX, update the AiStudioPanel usage:
  <AiStudioPanel summary={summary} />
```

- [ ] **Step 5: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors. If `marked()` return type causes an issue, cast: `marked(summary) as string`.

- [ ] **Step 6: Commit**

```bash
git add app/routes/video.tsx
git commit -m "feat: wire Gemini summary into video page AI Studio panel"
```

---

## Task 5: Update `app/routes/thesis.tsx`

**Files:**
- Modify: `app/routes/thesis.tsx`

- [ ] **Step 1: Add imports**

Add to the existing import block:

```tsx
import { useNavigation } from "react-router";
import { marked } from "marked";
import { generateThesis } from "../lib/ai";
import { Skeleton } from "../components/skeleton";
```

- [ ] **Step 2: Update the loader**

Replace the existing loader:

```ts
export async function loader({ params }: Route.LoaderArgs) {
  const project = getProject(params.projectId);
  if (!project) {
    throw new Response("Project not found", { status: 404 });
  }
  const thesis = await generateThesis(project.videos).catch(
    () => "Failed to generate thesis. Please try again."
  );
  return { project, thesis };
}
```

- [ ] **Step 3: Replace the page body**

In `ThesisPage`, destructure `thesis` from `useLoaderData`, add `useNavigation`, and replace all four hardcoded section `<div>`s with a single rendered markdown block:

```tsx
export default function ThesisPage() {
  const { project, thesis } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isGenerating =
    navigation.state === "loading" &&
    navigation.location?.pathname !== undefined;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1rem" }}>
      <Link
        to={`/projects/${project.id}`}
        style={{
          fontSize: "0.875rem",
          color: "#666",
          textDecoration: "none",
          marginBottom: "1rem",
          display: "inline-block",
        }}
      >
        &larr; {project.name}
      </Link>

      <h1
        style={{
          fontSize: "1.5rem",
          fontWeight: 600,
          marginBottom: "0.5rem",
        }}
      >
        Thesis Analysis
      </h1>

      <p
        style={{
          fontSize: "0.875rem",
          color: "#666",
          marginBottom: "2rem",
          paddingBottom: "1rem",
          borderBottom: "2px solid #e5e5e5",
        }}
      >
        Synthesized from{" "}
        <strong>
          {project.videos.length}{" "}
          {project.videos.length === 1 ? "video" : "videos"}
        </strong>{" "}
        in this project
      </p>

      {isGenerating ? (
        <Skeleton rows={8} />
      ) : (
        <div
          style={{ fontSize: "0.875rem", lineHeight: 1.7, color: "#444" }}
          dangerouslySetInnerHTML={{ __html: marked(thesis) as string }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/routes/thesis.tsx
git commit -m "feat: wire Gemini thesis synthesis into thesis page"
```

---

## Task 6: Environment setup and smoke test

**Files:**
- Create: `.env` (user creates this — not committed)
- Verify: `.gitignore` already excludes `.env`

- [ ] **Step 1: Confirm `.env` is gitignored**

```bash
cat .gitignore | grep env
```

Expected: `.env` or `*.env` appears. If not, add it:

```bash
echo ".env" >> .gitignore
git add .gitignore
git commit -m "chore: ensure .env is gitignored"
```

- [ ] **Step 2: Create `.env` file**

Create a file named `.env` at the project root with:

```
GEMINI_API_KEY=your_actual_key_here
```

To get a free API key: go to [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey), sign in with a Google account, and create a key. No credit card required.

- [ ] **Step 3: Run the dev server**

```bash
npm run dev
```

Expected: server starts on `http://localhost:5173` (or similar).

- [ ] **Step 4: Smoke test**

1. Create a project
2. Add a YouTube video URL
3. Navigate to the video page — observe the page takes 2–10 seconds to load (Gemini is running), then the Summary tab shows AI-generated markdown
4. Navigate to the project page, click Thesis Analysis — observe same loading behavior, thesis renders with Key Themes, Cross-Video Synthesis, Contradictions, Thesis Summary sections
5. Test error state: temporarily set `GEMINI_API_KEY=invalid` in `.env`, restart dev server, navigate to video — confirm "Failed to generate summary. Please try again." appears instead of crashing

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Covered by |
|---|---|
| `app/lib/ai.ts` with `generateVideoSummary` and `generateThesis` | Task 2 |
| `TranscriptChunk[]` join logic | Task 2 Step 1 |
| `Video[]` multi-source concatenation with headers | Task 2 Step 1 |
| `GEMINI_API_KEY` env var, server-side only | Task 2 Step 1 |
| `gemini-1.5-flash` model | Task 2 Step 1 |
| Reusable Skeleton component | Task 3 |
| Video page loader returns `summary` | Task 4 Step 2 |
| Summary tab renders markdown, shows skeleton during load | Task 4 Steps 3–4 |
| Thesis page loader returns `thesis` | Task 5 Step 2 |
| Thesis page renders markdown, shows skeleton during load | Task 5 Step 3 |
| Error fallback strings (summary + thesis) | Tasks 4+5 |
| `marked` for markdown→HTML | Tasks 4+5 |
| `.env` setup + gitignore | Task 6 |
| Video summary prompt (exact text) | Task 2 Step 1 |
| Thesis prompt (exact text, sections) | Task 2 Step 1 |

All spec requirements covered. No placeholders found.
