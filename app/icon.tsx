import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="22" height="22" viewBox="0 0 100 100" fill="white">
          <path d="M50 22 L53.06 42.61 L61.31 38.69 L57.39 46.94 L78 50 L57.39 53.06 L61.31 61.31 L53.06 57.39 L50 78 L46.94 57.39 L38.69 61.31 L42.61 53.06 L22 50 L42.61 46.94 L38.69 38.69 L46.94 42.61 Z" />
          <line x1="50" y1="4"  x2="50" y2="22" stroke="white" strokeWidth="4" strokeLinecap="round" />
          <line x1="50" y1="78" x2="50" y2="96" stroke="white" strokeWidth="4" strokeLinecap="round" />
          <line x1="4"  y1="50" x2="22" y2="50" stroke="white" strokeWidth="4" strokeLinecap="round" />
          <line x1="78" y1="50" x2="96" y2="50" stroke="white" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
