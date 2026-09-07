import { ImageResponse } from "next/og";

// Publisher wordmark for structured data (schema.org ImageObject on the
// NewsMediaOrganization) and Google News / Publisher Center. Google's
// guidance for publisher logos is a wide mark no taller than 60px at a
// 600px width, on a solid background, so this renders exactly 600x60.
export const runtime = "nodejs";

export const LOGO_WIDTH = 600;
export const LOGO_HEIGHT = 60;

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#060a12",
          padding: "0 22px",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 4,
            height: 36,
            backgroundColor: "#22d3ee",
            marginRight: 18,
          }}
        />
        <div
          style={{
            display: "flex",
            fontSize: 34,
            fontWeight: 800,
            letterSpacing: 1,
            color: "#e8eef7",
            whiteSpace: "nowrap",
          }}
        >
          THE JACKSON WIRE
        </div>
      </div>
    ),
    {
      width: LOGO_WIDTH,
      height: LOGO_HEIGHT,
      headers: {
        "Cache-Control": "public, s-maxage=604800, stale-while-revalidate",
      },
    },
  );
}
