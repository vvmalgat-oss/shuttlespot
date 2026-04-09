import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  // Fetch Inter 700 via Google Fonts CSS API → extract woff2 URL → fetch font bytes
  // This is the documented next/og approach for custom font weights.
  let fontData: ArrayBuffer | null = null;
  try {
    const css = await fetch(
      "https://fonts.googleapis.com/css2?family=Inter:wght@700",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        signal: AbortSignal.timeout(4000),
      }
    ).then((r) => r.text());

    const woffUrl = css.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/)?.[1];
    if (woffUrl) {
      fontData = await fetch(woffUrl, { signal: AbortSignal.timeout(4000) }).then(
        (r) => r.arrayBuffer()
      );
    }
  } catch {
    // fall back to default font — logo still renders, just less bold
  }

  return new ImageResponse(
    (
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 2px" }}>
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
          <span
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#0f172a",
              letterSpacing: "-1px",
              fontFamily: fontData ? "Inter" : "sans-serif",
            }}
          >
            Shuttle
          </span>
          <span
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#2563eb",
              letterSpacing: "-1px",
              fontFamily: fontData ? "Inter" : "sans-serif",
            }}
          >
            Spot
          </span>
        </div>
      </div>
    ),
    {
      width: 160,
      height: 44,
      fonts: fontData
        ? [{ name: "Inter", data: fontData, weight: 700, style: "normal" }]
        : [],
    }
  );
}
