import { Link, useLoaderData } from "react-router";
import { getProject } from "../lib/store";
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
  return { project };
}

const sectionStyle = {
  marginBottom: "2rem",
} as const;

const sectionTitleStyle = {
  fontSize: "1.125rem",
  fontWeight: 600,
  marginBottom: "0.75rem",
  paddingBottom: "0.5rem",
  borderBottom: "1px solid #e5e5e5",
} as const;

const bodyTextStyle = {
  fontSize: "0.875rem",
  lineHeight: 1.7,
  color: "#444",
} as const;

export default function ThesisPage() {
  const { project } = useLoaderData<typeof loader>();

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1rem" }}>
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

      {/* Key Themes */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Key Themes</h2>
        <ul style={{ ...bodyTextStyle, paddingLeft: "1.25rem", margin: 0 }}>
          <li style={{ marginBottom: "0.5rem" }}>
            Structural shift in monetary policy and its cascading effects on
            asset valuations across multiple sectors.
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            The divergence between public market sentiment and underlying
            fundamental indicators suggests a potential repricing event.
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            Geopolitical risk premiums are being systematically underpriced by
            consensus models, creating asymmetric opportunity.
          </li>
          <li>
            Technology-driven deflation in specific verticals is masking broader
            inflationary pressures in the real economy.
          </li>
        </ul>
      </div>

      {/* Cross-Video Synthesis */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Cross-Video Synthesis</h2>
        <p style={bodyTextStyle}>
          Across the analyzed sources, a consistent narrative emerges around the
          tension between accommodative monetary policy and deteriorating fiscal
          fundamentals. Multiple speakers independently arrive at the conclusion
          that current market pricing does not adequately reflect tail risks,
          though they differ on timing and catalysts. The synthesis reveals a
          convergence on the thesis that real assets will outperform nominal
          assets over the medium term, with particular emphasis on commodities
          and infrastructure as beneficiaries of the current macro regime.
        </p>
        <p style={{ ...bodyTextStyle, marginTop: "0.75rem" }}>
          Where the sources diverge most significantly is on the role of
          technology as a deflationary counterweight. Two of the analyzed videos
          argue that AI-driven productivity gains will be sufficient to offset
          structural inflation, while the others contend that such gains are
          concentrated in a narrow band of the economy and will not translate to
          broad-based disinflation.
        </p>
      </div>

      {/* Contradictions Found */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Contradictions Found</h2>
        <ul style={{ ...bodyTextStyle, paddingLeft: "1.25rem", margin: 0 }}>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Interest rate trajectory:</strong> Source 1 projects rates
            remaining elevated through 2026, while Source 3 anticipates
            aggressive cuts beginning Q2 2025.
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>China exposure:</strong> Conflicting assessments on whether
            Chinese equities represent deep value or a value trap given ongoing
            regulatory headwinds.
          </li>
          <li>
            <strong>Dollar strength:</strong> One source positions for sustained
            dollar dominance; another argues for structural decline tied to
            de-dollarization trends in emerging markets.
          </li>
        </ul>
      </div>

      {/* Thesis Summary */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Thesis Summary</h2>
        <p style={bodyTextStyle}>
          The weight of evidence across all analyzed transcripts supports a
          cautiously contrarian positioning: overweight real assets and
          commodities, maintain selective exposure to technology platforms with
          proven monetization, and reduce allocation to duration-sensitive fixed
          income. The consensus blind spot identified through cross-referencing
          these sources is the underappreciation of fiscal dominance as a regime
          shift — most market participants are still operating under a monetary
          policy-first framework that may no longer apply. The strongest
          actionable signal is the convergence across otherwise divergent sources
          on the mispricing of inflation volatility, suggesting options
          strategies as a capital-efficient expression of this thesis.
        </p>
      </div>
    </div>
  );
}
