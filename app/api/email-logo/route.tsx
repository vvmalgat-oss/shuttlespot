import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  let fonts: ConstructorParameters<typeof ImageResponse>[1]["fonts"] = [];

  try {
    const fontRes = await fetch(
      "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZJh.woff2",
      { signal: AbortSignal.timeout(3000) }
    );
    if (fontRes.ok) {
      const fontData = await fontRes.arrayBuffer();
      fonts = [{ name: "Inter", data: fontData, weight: 800, style: "normal" }];
    }
  } catch {
    // fall back to default font
  }

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
          <span style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-1px", fontFamily: fonts.length ? "Inter" : "sans-serif" }}>
            Shuttle
          </span>
          <span style={{ fontSize: 22, fontWeight: 800, color: "#2563eb", letterSpacing: "-1px", fontFamily: fonts.length ? "Inter" : "sans-serif" }}>
            Spot
          </span>
        </div>
      </div>
    ),
    { width: 160, height: 44, fonts }
  );
}
