import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("projects/:projectId", "routes/project.tsx"),
  route("projects/:projectId/videos/:videoId", "routes/video.tsx"),
  route("projects/:projectId/thesis", "routes/thesis.tsx"),
] satisfies RouteConfig;
