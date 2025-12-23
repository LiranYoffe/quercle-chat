import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Quercle Chat - Model-agnostic AI chat with web capabilities";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #09090b 0%, #18181b 50%, #27272a 100%)",
          position: "relative",
        }}
      >
        {/* Small chat bubble - top left */}
        <div
          style={{
            position: "absolute",
            left: 100,
            top: 100,
            width: 140,
            height: 50,
            background: "rgba(63, 63, 70, 0.5)",
            borderRadius: 25,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: "#71717a" }} />
            <div style={{ width: 8, height: 8, borderRadius: 4, background: "#71717a" }} />
            <div style={{ width: 8, height: 8, borderRadius: 4, background: "#71717a" }} />
          </div>
        </div>

        {/* Small chat bubble - top right */}
        <div
          style={{
            position: "absolute",
            right: 120,
            top: 140,
            width: 100,
            height: 40,
            background: "rgba(59, 130, 246, 0.2)",
            borderRadius: 20,
          }}
        />

        {/* Small chat bubble - bottom left */}
        <div
          style={{
            position: "absolute",
            left: 140,
            bottom: 160,
            width: 120,
            height: 45,
            background: "rgba(59, 130, 246, 0.25)",
            borderRadius: 22,
          }}
        />

        {/* Small chat bubble - bottom right */}
        <div
          style={{
            position: "absolute",
            right: 100,
            bottom: 120,
            width: 160,
            height: 50,
            background: "rgba(63, 63, 70, 0.4)",
            borderRadius: 25,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: "#52525b" }} />
            <div style={{ width: 8, height: 8, borderRadius: 4, background: "#52525b" }} />
            <div style={{ width: 8, height: 8, borderRadius: 4, background: "#52525b" }} />
          </div>
        </div>

        {/* Main chat bubble with Quercle icon - classic speech bubble style */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
            position: "relative",
          }}
        >
          {/* Speech bubble SVG */}
          <svg width="280" height="250" viewBox="0 0 200 180" fill="none">
            {/* Bubble body - continuous path without internal lines */}
            <path
              d="M30 0
                 L150 0
                 Q180 0, 180 30
                 L180 110
                 Q180 140, 150 140
                 L55 140
                 L25 175
                 L35 140
                 L30 140
                 Q0 140, 0 110
                 L0 30
                 Q0 0, 30 0
                 Z"
              fill="rgba(59, 130, 246, 0.25)"
              stroke="rgba(59, 130, 246, 0.6)"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            {/* Quercle Icon inside */}
            <g transform="translate(50, 30)">
              <circle cx="40" cy="40" r="32" stroke="#60a5fa" strokeWidth="6" fill="none"/>
              <line x1="64" y1="64" x2="82" y2="82" stroke="#60a5fa" strokeWidth="6" strokeLinecap="round"/>
              <circle cx="40" cy="40" r="19" stroke="#60a5fa" strokeWidth="2.5" fill="none"/>
              <ellipse cx="40" cy="40" rx="19" ry="7" stroke="#60a5fa" strokeWidth="2" fill="none"/>
              <ellipse cx="40" cy="40" rx="7" ry="19" stroke="#60a5fa" strokeWidth="2" fill="none"/>
              <line x1="21" y1="40" x2="59" y2="40" stroke="#60a5fa" strokeWidth="2"/>
              <line x1="40" y1="21" x2="40" y2="59" stroke="#60a5fa" strokeWidth="2"/>
            </g>
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            fontSize: 72,
            fontWeight: 700,
            color: "#fafafa",
            letterSpacing: "-0.02em",
            marginBottom: 16,
          }}
        >
          Quercle Chat
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: "flex",
            fontSize: 28,
            color: "#a1a1aa",
            letterSpacing: "0.01em",
          }}
        >
          Model-agnostic AI chat with web capabilities
        </div>
      </div>
    ),
    { ...size }
  );
}
