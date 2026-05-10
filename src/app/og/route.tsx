import { ImageResponse } from "next/og";

export const revalidate = 86400; // 24 hours

const DEFAULT_TITLE = "Himalayan Atlas";
const DEFAULT_SUBTITLE = "Modern frontend for Himalayan weather and climate data";
const DEFAULT_ACCENT = "#0a0a0a";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") ?? DEFAULT_TITLE;
  const subtitle = searchParams.get("subtitle") ?? DEFAULT_SUBTITLE;
  const accent = searchParams.get("accent") ?? DEFAULT_ACCENT;

  return new ImageResponse(
    <div
      style={{
        width: 1200,
        height: 630,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#fff",
      }}
    >
      {/* Top 70%: title + subtitle, centered */}
      <div
        style={{
          flex: "0 0 70%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "0 80px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 80,
            fontWeight: 600,
            color: "#0a0a0a",
            lineHeight: 1.1,
            marginBottom: 32,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 32,
            fontWeight: 400,
            color: "#525252",
            lineHeight: 1.3,
          }}
        >
          {subtitle}
        </div>
      </div>
      {/* Bottom 30%: accent stripe */}
      <div
        style={{
          flex: "0 0 30%",
          backgroundColor: accent,
        }}
      />
    </div>,
    { width: 1200, height: 630 },
  );
}
