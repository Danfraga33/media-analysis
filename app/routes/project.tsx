import { useState } from "react";
import { Link, useFetcher, useLoaderData } from "react-router";
import { YoutubeTranscript } from "youtube-transcript";
import {
  getProject,
  addVideoToProject,
  fetchVideoTitle,
} from "../lib/store";
import { extractVideoId } from "../lib/transcript";
import type { Route } from "./+types/project";

export function meta({ data }: Route.MetaArgs) {
  const name = data?.project?.name ?? "Project";
  return [{ title: `${name} — Media Analysis` }];
}

export async function loader({ params }: Route.LoaderArgs) {
  const project = getProject(params.projectId);
  if (!project) {
    throw new Response("Project not found", { status: 404 });
  }
  return { project };
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const url = (formData.get("url") as string)?.trim();

  if (!url) {
    return { error: "Please enter a YouTube URL" };
  }

  const videoId = extractVideoId(url);
  if (!videoId) {
    return { error: "Could not extract video ID from URL" };
  }

  try {
    const [transcript, title] = await Promise.all([
      YoutubeTranscript.fetchTranscript(videoId),
      fetchVideoTitle(videoId),
    ]);
    const video = addVideoToProject(
      params.projectId,
      url,
      videoId,
      title,
      transcript
    );
    if (!video) {
      return { error: "Project not found" };
    }
    return { error: null, success: true };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to fetch transcript";
    return { error: message };
  }
}

export default function ProjectPage() {
  const { project } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const [url, setUrl] = useState("");

  const isLoading = fetcher.state !== "idle";
  const data = fetcher.data;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1rem" }}>
      <Link
        to="/"
        style={{
          fontSize: "0.875rem",
          color: "#666",
          textDecoration: "none",
          marginBottom: "1rem",
          display: "inline-block",
        }}
      >
        &larr; All Projects
      </Link>

      <h1
        style={{
          fontSize: "1.5rem",
          fontWeight: 600,
          marginBottom: "1.5rem",
        }}
      >
        {project.name}
      </h1>

      <fetcher.Form
        method="post"
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "2rem",
        }}
      >
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
          {isLoading ? "Fetching..." : "Add Video"}
        </button>
      </fetcher.Form>

      {data?.error && (
        <p style={{ color: "#dc2626", marginBottom: "1rem" }}>{data.error}</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {/* Pinned Thesis Analysis card */}
        <Link
          to={`/projects/${project.id}/thesis`}
          style={{
            textDecoration: "none",
            color: "inherit",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.75rem 1rem",
            border: "2px solid #2563eb",
            borderRadius: 4,
            backgroundColor: "#eff6ff",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span
              style={{
                fontSize: "0.625rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "#fff",
                backgroundColor: "#2563eb",
                padding: "2px 6px",
                borderRadius: 3,
              }}
            >
              Pinned
            </span>
            <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>
              Thesis Analysis
            </span>
          </div>
          <div style={{ fontSize: "0.75rem", color: "#666" }}>
            {project.videos.length}{" "}
            {project.videos.length === 1 ? "source" : "sources"}
          </div>
        </Link>

        {/* Video list */}
        {project.videos.length === 0 ? (
          <p style={{ color: "#999", fontSize: "0.875rem", marginTop: "0.5rem" }}>
            No videos yet. Add a YouTube URL above.
          </p>
        ) : (
          project.videos.map((video) => (
            <Link
              key={video.id}
              to={`/projects/${project.id}/videos/${video.id}`}
              style={{
                textDecoration: "none",
                color: "inherit",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.75rem 1rem",
                border: "1px solid #e5e5e5",
                borderRadius: 4,
              }}
            >
              <div>
                <div style={{ fontSize: "0.875rem", fontWeight: 500 }}>
                  {video.title}
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#999",
                    marginTop: 2,
                  }}
                >
                  {video.videoId}
                </div>
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "#999",
                  flexShrink: 0,
                  marginLeft: "1rem",
                }}
              >
                {video.transcript.length} chunks &middot;{" "}
                {new Date(video.createdAt).toLocaleDateString()}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
