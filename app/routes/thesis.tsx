import { Link, useLoaderData, useNavigation } from "react-router";
import { marked } from "marked";
import { getProject } from "../lib/store";
import { generateThesis } from "../lib/ai";
import { Skeleton } from "../components/skeleton";
import type { Route } from "./+types/thesis";

export function meta({ data }: Route.MetaArgs) {
  const name = data?.project?.name ?? "Project";
  return [{ title: `Thesis Analysis — ${name} — Media Analysis` }];
}

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


export default function ThesisPage() {
  const { project, thesis } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isGenerating =
    navigation.state === "loading" &&
    navigation.location?.pathname !== undefined;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1rem" }}>
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
