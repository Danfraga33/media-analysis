import { useState } from "react";
import { Form, Link, redirect, useLoaderData } from "react-router";
import { getAllProjects, createProject } from "../lib/store";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Media Analysis — Projects" },
    { name: "description", content: "YouTube transcript analysis projects" },
  ];
}

export async function loader() {
  return { projects: getAllProjects() };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const name = (formData.get("name") as string)?.trim();

  if (!name) {
    return { error: "Please enter a project name" };
  }

  const project = createProject(name);
  return redirect(`/projects/${project.id}`);
}

export default function Home() {
  const { projects } = useLoaderData<typeof loader>();
  const [name, setName] = useState("");

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1
        style={{
          fontSize: "1.5rem",
          fontWeight: 600,
          marginBottom: "1.5rem",
        }}
      >
        Projects
      </h1>

      <Form
        method="post"
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "2rem",
        }}
      >
        <input
          type="text"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New project name..."
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
          style={{
            padding: "0.5rem 1.25rem",
            backgroundColor: "#111",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            fontSize: "1rem",
            cursor: "pointer",
            fontFamily: "Helvetica, Arial, sans-serif",
          }}
        >
          Create Project
        </button>
      </Form>

      {projects.length === 0 ? (
        <p style={{ color: "#999", fontSize: "0.875rem" }}>
          No projects yet. Create one above to get started.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "1rem",
          }}
        >
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div style={{ position: "relative", paddingTop: 12 }}>
                {/* Folder tab */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 12,
                    width: 60,
                    height: 12,
                    backgroundColor: "#f5f0e8",
                    borderRadius: "4px 4px 0 0",
                    border: "1px solid #d4cfc7",
                    borderBottom: "none",
                  }}
                />
                {/* Folder body */}
                <div
                  style={{
                    backgroundColor: "#f5f0e8",
                    border: "1px solid #d4cfc7",
                    borderRadius: "0 4px 4px 4px",
                    padding: "1rem",
                    minHeight: 100,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: "0.95rem",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {project.name}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#888" }}>
                    {project.videos.length}{" "}
                    {project.videos.length === 1 ? "video" : "videos"}
                    <br />
                    {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
