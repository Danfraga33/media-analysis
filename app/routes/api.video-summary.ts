import { getVideo } from "../lib/store";
import { generateVideoSummary } from "../lib/ai";

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId");
  const videoId = url.searchParams.get("videoId");

  if (!projectId || !videoId) {
    return Response.json({ error: "Missing params" }, { status: 400 });
  }

  const result = getVideo(projectId, videoId);
  if (!result) {
    return Response.json({ error: "Video not found" }, { status: 404 });
  }

  try {
    const summary = await generateVideoSummary(result.video.transcript);
    return Response.json({ summary });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to generate summary";
    return Response.json({ error: message }, { status: 500 });
  }
}
