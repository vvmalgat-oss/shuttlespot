import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Generates a 32×32 PNG — same blue rounded-square badge as the navbar logo.
// Uses the exact same SVG paths as ShuttlecockIcon in ShuttlecockLogo.tsx.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 7,
          background: "#1745c2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="18" height="22" viewBox="0 0 20 24">
          {/* Feather fan */}
          <path d="M10 13 L2 3.5 Q10 -1.5 18 3.5 Z" fill="white" />
          {/* Stem */}
          <rect x="9" y="12" width="2" height="6" rx="1" fill="white" />
          {/* Cork */}
          <ellipse cx="10" cy="20.5" rx="3" ry="2" fill="white" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
