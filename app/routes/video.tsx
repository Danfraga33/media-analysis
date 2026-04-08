import { useEffect, useState } from "react";
import { Link, useFetcher, useLoaderData } from "react-router";
import { marked } from "marked";
import { getVideo } from "../lib/store";
import { TranscriptView } from "../components/transcript-view";
import { Skeleton } from "../components/skeleton";
import type { Route } from "./+types/video";

export function meta({ data }: Route.MetaArgs) {
  const title = data?.video?.title ?? "Video";
  const projectName = data?.project?.name ?? "Project";
  return [{ title: `${title} — ${projectName} — Media Analysis` }];
}

export async function loader({ params }: Route.LoaderArgs) {
  const result = getVideo(params.projectId, params.videoId);
  if (!result) {
    throw new Response("Video not found", { status: 404 });
  }
  return result;
}

const tabs = ["Summary", "Mind Map", "Explainer"] as const;
type Tab = (typeof tabs)[number];

function VideoEmbed({ videoId, title }: { videoId: string; title: string }) {
  const [playing, setPlaying] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{ marginBottom: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
        <span style={{ fontSize: "0.75rem", color: "#999", fontWeight: 500 }}>Video</span>
        <button
          onClick={() => setCollapsed((c) => !c)}
          style={{
            fontSize: "0.75rem",
            color: "#999",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "2px 6px",
            borderRadius: 3,
            fontFamily: "Helvetica, Arial, sans-serif",
          }}
        >
          {collapsed ? "Show" : "Hide"}
        </button>
      </div>

      {!collapsed && (
        <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", borderRadius: 6, overflow: "hidden", background: "#000" }}>
          {playing ? (
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
            />
          ) : (
            <button
              onClick={() => setPlaying(true)}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none", background: "none", cursor: "pointer", padding: 0 }}
              aria-label="Play video"
            >
              <img
                src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                alt={title}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
              {/* Play button overlay */}
              <div style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0,0,0,0.25)",
              }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.95)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
                }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <polygon points="6,3 18,10 6,17" fill="#111" />
                  </svg>
                </div>
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function AiStudioPanel({
  projectId,
  videoId,
}: {
  projectId: string;
  videoId: string;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("Summary");
  const fetcher = useFetcher();
  const [summary, setSummary] = useState<string | null>(null);

  useEffect(() => {
    void fetcher.load(
      `/api/video-summary?projectId=${projectId}&videoId=${videoId}`,
    );
  }, [projectId, videoId]);

  useEffect(() => {
    if (fetcher.data && (fetcher.data as any).summary) {
      setSummary((fetcher.data as any).summary);
    }
  }, [fetcher.data]);

  const isGenerating = fetcher.state === "loading" && summary === null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid #e5e5e5",
          marginBottom: "1rem",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "0.5rem 1rem",
              fontSize: "0.8125rem",
              fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? "#111" : "#999",
              background: "none",
              border: "none",
              borderBottom:
                activeTab === tab ? "2px solid #111" : "2px solid transparent",
              cursor: "pointer",
              fontFamily: "Helvetica, Arial, sans-serif",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          fontSize: "0.875rem",
          lineHeight: 1.6,
          color: "#333",
        }}
      >
        {activeTab === "Summary" && (
          <div>
            <h3
              style={{
                fontSize: "0.9375rem",
                fontWeight: 600,
                marginBottom: "0.75rem",
              }}
            >
              Summary
            </h3>
            {isGenerating || summary === null ? (
              <Skeleton rows={8} />
            ) : (
              <div
                className="md-body"
                style={{ color: "#444", fontSize: "0.875rem", lineHeight: 1.7 }}
                dangerouslySetInnerHTML={{ __html: marked(summary) as string }}
              />
            )}
          </div>
        )}

        {activeTab === "Mind Map" && (
          <div>
            <h3
              style={{
                fontSize: "0.9375rem",
                fontWeight: 600,
                marginBottom: "0.75rem",
              }}
            >
              Mind Map
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              <li style={{ marginBottom: "0.5rem" }}>
                <strong>Main Topic</strong>
                <ul
                  style={{
                    listStyle: "none",
                    paddingLeft: "1.25rem",
                    marginTop: "0.25rem",
                  }}
                >
                  <li style={{ marginBottom: "0.25rem" }}>
                    &mdash; Subtopic A
                    <ul
                      style={{
                        listStyle: "none",
                        paddingLeft: "1.25rem",
                        marginTop: "0.25rem",
                      }}
                    >
                      <li style={{ color: "#666" }}>&mdash; Key Point 1</li>
                      <li style={{ color: "#666" }}>&mdash; Key Point 2</li>
                    </ul>
                  </li>
                  <li style={{ marginBottom: "0.25rem" }}>
                    &mdash; Subtopic B
                    <ul
                      style={{
                        listStyle: "none",
                        paddingLeft: "1.25rem",
                        marginTop: "0.25rem",
                      }}
                    >
                      <li style={{ color: "#666" }}>
                        &mdash; Supporting Evidence
                      </li>
                      <li style={{ color: "#666" }}>
                        &mdash; Counter Argument
                      </li>
                    </ul>
                  </li>
                </ul>
              </li>
              <li>
                <strong>Secondary Topic</strong>
                <ul
                  style={{
                    listStyle: "none",
                    paddingLeft: "1.25rem",
                    marginTop: "0.25rem",
                  }}
                >
                  <li style={{ marginBottom: "0.25rem" }}>
                    &mdash; Related Concept
                    <ul
                      style={{
                        listStyle: "none",
                        paddingLeft: "1.25rem",
                        marginTop: "0.25rem",
                      }}
                    >
                      <li style={{ color: "#666" }}>&mdash; Detail 1</li>
                      <li style={{ color: "#666" }}>&mdash; Detail 2</li>
                    </ul>
                  </li>
                </ul>
              </li>
            </ul>
          </div>
        )}

        {activeTab === "Explainer" && (
          <div>
            <h3
              style={{
                fontSize: "0.9375rem",
                fontWeight: 600,
                marginBottom: "0.75rem",
              }}
            >
              Explainer
            </h3>
            <ul style={{ paddingLeft: "1.25rem", margin: 0 }}>
              <li style={{ marginBottom: "0.5rem", color: "#666" }}>
                The speaker introduces the core thesis around the 2-minute mark,
                establishing the framework for the rest of the discussion.
              </li>
              <li style={{ marginBottom: "0.5rem", color: "#666" }}>
                A key distinction is drawn between short-term market reactions
                and long-term structural shifts, citing three historical
                precedents.
              </li>
              <li style={{ marginBottom: "0.5rem", color: "#666" }}>
                The analysis pivots at the midpoint to address potential
                counterarguments, which strengthens the overall position.
              </li>
              <li style={{ color: "#666" }}>
                Concluding remarks tie back to the opening thesis, with an
                actionable takeaway for the audience.
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VideoPage() {
  const { project, video } = useLoaderData<typeof loader>();

  return (
    <div style={{ width: "100%", padding: "2rem" }}>
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
          marginBottom: "1.5rem",
        }}
      >
        {video.title}
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1px 1fr",
          gap: "0 2rem",
          alignItems: "start",
        }}
      >
        {/* Left panel — Transcript */}
        <div>
          <VideoEmbed videoId={video.videoId} title={video.title} />
          <h2
            style={{
              fontSize: "0.8125rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "#999",
              marginBottom: "0.75rem",
            }}
          >
            Transcript
          </h2>
          <TranscriptView chunks={video.transcript} />
        </div>

        {/* Divider */}
        <div style={{ alignSelf: "stretch", background: "linear-gradient(to bottom, transparent, #d1d5db 8%, #d1d5db 92%, transparent)", width: 1 }} />

        {/* Right panel — AI Studio */}
        <div
          style={{
            padding: "1rem",
            position: "sticky",
            top: "2rem",
            maxHeight: "calc(100vh - 4rem)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <h2
            style={{
              fontSize: "0.8125rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "#999",
              marginBottom: "0.75rem",
            }}
          >
            AI Studio
          </h2>
          <AiStudioPanel projectId={project.id} videoId={video.id} />
        </div>
      </div>
    </div>
  );
}
