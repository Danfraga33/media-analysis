import type { TranscriptChunk } from "./transcript";

export interface Video {
  id: string;
  title: string;
  url: string;
  videoId: string;
  transcript: TranscriptChunk[];
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  videos: Video[];
}

const projects = new Map<string, Project>();

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function generateSlug(name: string): string {
  const base = slugify(name);
  if (!projects.has(base)) return base;

  let i = 2;
  while (projects.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

let nextVideoId = 1;

export function getAllProjects(): Project[] {
  return Array.from(projects.values()).sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getProject(id: string): Project | undefined {
  return projects.get(id);
}

export function createProject(name: string): Project {
  const id = generateSlug(name);
  const project: Project = {
    id,
    name,
    createdAt: new Date().toISOString(),
    videos: [],
  };
  projects.set(id, project);
  return project;
}

export async function fetchVideoTitle(videoId: string): Promise<string> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );
    if (res.ok) {
      const data = await res.json();
      return data.title ?? videoId;
    }
  } catch {
    // fall through
  }
  return videoId;
}

export function addVideoToProject(
  projectId: string,
  url: string,
  videoId: string,
  title: string,
  transcript: TranscriptChunk[]
): Video | null {
  const project = projects.get(projectId);
  if (!project) return null;

  const video: Video = {
    id: String(nextVideoId++),
    title,
    url,
    videoId,
    transcript,
    createdAt: new Date().toISOString(),
  };
  project.videos.push(video);
  return video;
}

export function getVideo(
  projectId: string,
  videoId: string
): { project: Project; video: Video } | null {
  const project = projects.get(projectId);
  if (!project) return null;

  const video = project.videos.find((v) => v.id === videoId);
  if (!video) return null;

  return { project, video };
}
