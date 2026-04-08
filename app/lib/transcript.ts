export interface TranscriptChunk {
  text: string;
  offset: number;
  duration: number;
}

export interface TranscriptGroup {
  startMs: number;
  chunks: TranscriptChunk[];
}

export function groupTranscript(
  chunks: TranscriptChunk[],
  intervalMs = 30000
): TranscriptGroup[] {
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

export function formatTimestamp(offsetMs: number): string {
  const totalSeconds = Math.floor(offsetMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function formatRange(startMs: number, intervalMs = 30000): string {
  return `${formatTimestamp(startMs)} – ${formatTimestamp(startMs + intervalMs)}`;
}

export function extractVideoId(url: string): string | null {
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

  if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) {
    return url.trim();
  }

  return null;
}
