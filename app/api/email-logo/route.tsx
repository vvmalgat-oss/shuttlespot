import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  // Load Inter ExtraBold (800) from Google Fonts so the wordmark renders bold
  const fontRes = await fetch(
    "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZJh.woff2"
  );
  const fontData = await fontRes.arrayBuffer();

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
          <span style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-1px", fontFamily: "Inter" }}>
            Shuttle
          </span>
          <span style={{ fontSize: 22, fontWeight: 800, color: "#2563eb", letterSpacing: "-1px", fontFamily: "Inter" }}>
            Spot
          </span>
        </div>
      </div>
    ),
    {
      width: 160,
      height: 44,
      fonts: [
        {
          name: "Inter",
          data: fontData,
          weight: 800,
          style: "normal",
        },
      ],
    }
  );
}
