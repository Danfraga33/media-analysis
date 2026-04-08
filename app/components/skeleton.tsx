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
