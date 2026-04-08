import { useState } from "react";
import { useFetcher } from "react-router";
import { YoutubeTranscript } from "youtube-transcript";
import type { Route } from "./+types/home";

interface TranscriptChunk {
  text: string;
  offset: number;
  duration: number;
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "YouTube Transcript Viewer" },
    {
      name: "description",
      content: "Fetch and view YouTube video transcripts",
    },
  ];
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const url = formData.get("url") as string;

  if (!url) {
    return { error: "Please enter a YouTube URL", transcript: null };
  }

  const videoId = extractVideoId(url);
  if (!videoId) {
    return { error: "Could not extract video ID from URL", transcript: null };
  }

  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    return { error: null, transcript, videoId };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch transcript";
    return { error: message, transcript: null };
  }
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  // Maybe they just pasted a video ID directly
  if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) {
    return url.trim();
  }

  return null;
}

interface TranscriptGroup {
  startMs: number;
  chunks: TranscriptChunk[];
}

function groupTranscript(chunks: TranscriptChunk[], intervalMs = 30000): TranscriptGroup[] {
  const groups: TranscriptGroup[] = [];

  for (const chunk of chunks) {
    const groupStart = Math.floor(chunk.offset / intervalMs) * intervalMs;
    const lastGroup = groups[groups.length - 1];

    if (lastGroup && lastGroup.startMs === groupStart) {
      lastGroup.chunks.push(chunk);
    } else {
      groups.push({ startMs: groupStart, chunks: [chunk] });
    }
  }

  return groups;
}

function formatTimestamp(offsetMs: number): string {
  const totalSeconds = Math.floor(offsetMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatRange(startMs: number, intervalMs = 30000): string {
  return `${formatTimestamp(startMs)} – ${formatTimestamp(startMs + intervalMs)}`;
}

export default function Home() {
  const fetcher = useFetcher<typeof action>();
  const [url, setUrl] = useState("");

  const isLoading = fetcher.state !== "idle";
  const data = fetcher.data;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1
        style={{
          fontSize: "1.5rem",
          fontWeight: 600,
          marginBottom: "1.5rem",
        }}
      >
        YouTube Transcript Viewer
      </h1>

      <fetcher.Form method="post" style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <input
          type="text"
          name="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste a YouTube URL..."
          style={{
            flex: 1,
            padding: "0.5rem 0.75rem",
            border: "1px solid #ccc",
            borderRadius: 4,
            fontSize: "1rem",
            fontFamily: "Helvetica, Arial, sans-serif",
          }}
        />
        <button
          type="submit"
          disabled={isLoading}
          style={{
            padding: "0.5rem 1.25rem",
            backgroundColor: "#111",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            fontSize: "1rem",
            cursor: isLoading ? "wait" : "pointer",
            fontFamily: "Helvetica, Arial, sans-serif",
          }}
        >
          {isLoading ? "Fetching..." : "Get Transcript"}
        </button>
      </fetcher.Form>

      {data?.error && (
        <p style={{ color: "#dc2626", marginBottom: "1rem" }}>{data.error}</p>
      )}

      {data?.transcript && (
        <div>
          <p style={{ fontSize: "0.875rem", color: "#666", marginBottom: "1rem" }}>
            {data.transcript.length} chunks &middot; Video ID: {data.videoId}
          </p>
          <div
            style={{
              maxHeight: "70vh",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            {groupTranscript(data.transcript as TranscriptChunk[]).map((group, gi) => (
              <div
                key={gi}
                style={{
                  border: "1px solid #e5e5e5",
                  borderRadius: 4,
                  padding: "0.75rem 1rem",
                }}
              >
                <div
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "#666",
                    marginBottom: "0.5rem",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {formatRange(group.startMs)}
                </div>
                <div style={{ fontSize: "0.875rem", lineHeight: 1.6 }}>
                  {group.chunks.map((chunk, ci) => (
                    <span key={ci}>{chunk.text} </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
