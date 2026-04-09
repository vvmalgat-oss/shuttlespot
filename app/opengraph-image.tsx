import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ShuttleSpot — Find Badminton Courts Across Australia";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Background pattern dots */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Glow */}
        <div
          style={{
            position: "absolute",
            width: 600,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(59,130,246,0.25) 0%, transparent 70%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />

        {/* Content */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", gap: 0 }}>
          {/* Shuttlecock emoji */}
          <div style={{ fontSize: 80, marginBottom: 24 }}>🏸</div>

          {/* Wordmark */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <span style={{ fontSize: 56, fontWeight: 800, color: "#ffffff", letterSpacing: "-2px" }}>
              ShuttleSpot
            </span>
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: 26,
              color: "rgba(255,255,255,0.65)",
              fontWeight: 400,
              textAlign: "center",
              maxWidth: 700,
              lineHeight: 1.4,
            }}
          >
            Find &amp; book badminton courts across Australia
          </div>

          {/* Pills */}
          <div style={{ display: "flex", gap: 12, marginTop: 36 }}>
            {["106+ venues", "All states", "Free to use"].map((label) => (
              <div
                key={label}
                style={{
                  background: "rgba(59,130,246,0.2)",
                  border: "1px solid rgba(59,130,246,0.4)",
                  borderRadius: 999,
                  padding: "8px 20px",
                  fontSize: 18,
                  color: "rgba(255,255,255,0.85)",
                  fontWeight: 600,
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* URL watermark */}
        <div
          style={{
            position: "absolute",
            bottom: 36,
            fontSize: 18,
            color: "rgba(255,255,255,0.35)",
            letterSpacing: "0.5px",
          }}
        >
          shuttlespot.vercel.app
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
