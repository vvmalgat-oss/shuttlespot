import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "4px 2px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            background: "#2563eb",
            borderRadius: 10,
          }}
        >
          <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
            <path d="M10 13 L2 3.5 Q10 -1.5 18 3.5 Z" fill="white" />
            <rect x="9" y="12" width="2" height="6" rx="1" fill="white" />
            <ellipse cx="10" cy="20.5" rx="3" ry="2" fill="white" />
          </svg>
        </div>
        <div style={{ display: "flex" }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.5px" }}>
            Shuttle
          </span>
          <span style={{ fontSize: 20, fontWeight: 700, color: "#2563eb", letterSpacing: "-0.5px" }}>
            Spot
          </span>
        </div>
      </div>
    ),
    { width: 160, height: 44 }
  );
}
