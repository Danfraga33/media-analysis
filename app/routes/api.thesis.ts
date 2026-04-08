import { getProject } from "../lib/store";
import { generateThesis } from "../lib/ai";

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId");

  if (!projectId) {
    return Response.json({ error: "Missing projectId" }, { status: 400 });
  }

  const project = getProject(projectId);
  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  try {
    const thesis = await generateThesis(project.videos);
    return Response.json({ thesis });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to generate thesis";
    return Response.json({ error: message }, { status: 500 });
  }
}
