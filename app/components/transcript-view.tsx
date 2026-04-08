import {
  groupTranscript,
  formatRange,
  type TranscriptChunk,
} from "../lib/transcript";

export function TranscriptView({ chunks }: { chunks: TranscriptChunk[] }) {
  const groups = groupTranscript(chunks);

  return (
    <div
      style={{
        maxHeight: "70vh",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      {groups.map((group, gi) => (
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
  );
}
