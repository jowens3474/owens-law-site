import { ImageResponse } from "next/og";
import sharp from "sharp";
import { getPostBySlug, formatDate } from "@/lib/posts";

// Generates a branded 1080x1080 card image for a published article, used as
// the Instagram post image by scripts/post-instagram.mjs. Instagram's Graph
// API only accepts JPEG via image_url, so the PNG ImageResponse produces is
// converted with sharp before being returned.
export const runtime = "nodejs";

const SIZE = 1080;
const PAD = 80;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) {
    return new Response("Not found", { status: 404 });
  }

  const headlineSize = post.title.length > 70 ? 56 : 72;

  const png = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#060a12",
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            display: "flex",
            width: "100%",
            height: 4,
            backgroundImage:
              "linear-gradient(90deg, #22d3ee 0%, #0891b2 45%, rgba(34,211,238,0) 100%)",
          }}
        />

        {/* Body */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: `${PAD - 4}px ${PAD}px ${PAD}px ${PAD}px`,
            justifyContent: "space-between",
          }}
        >
          {/* Category */}
          <div
            style={{
              display: "flex",
              fontSize: 28,
              fontWeight: 700,
              color: "#22d3ee",
              letterSpacing: 4,
              textTransform: "uppercase",
            }}
          >
            {post.category}
          </div>

          {/* Headline + dek, vertically centered */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              justifyContent: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: headlineSize,
                fontWeight: 800,
                color: "#e8eef7",
                lineHeight: 1.15,
                maxHeight: headlineSize * 1.15 * 4,
                overflow: "hidden",
              }}
            >
              {post.title}
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 28,
                fontSize: 34,
                fontWeight: 400,
                color: "#94a3b8",
                lineHeight: 1.45,
                maxHeight: 34 * 1.45 * 3,
                overflow: "hidden",
              }}
            >
              {post.dek}
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              paddingTop: 28,
              borderTop: "1px solid #1e293b",
            }}
          >
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
              <div style={{ display: "flex", fontSize: 32, fontWeight: 700, color: "#e8eef7" }}>
                THE JACKSON WIRE
              </div>
              <div
                style={{
                  display: "flex",
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  backgroundColor: "#22d3ee",
                  margin: "0 16px",
                }}
              />
              <div style={{ display: "flex", fontSize: 28, fontWeight: 400, color: "#94a3b8" }}>
                thejacksonwire.com
              </div>
            </div>
            <div style={{ display: "flex", fontSize: 28, fontWeight: 400, color: "#94a3b8" }}>
              {formatDate(post.date)}
            </div>
          </div>
        </div>
      </div>
    ),
    { width: SIZE, height: SIZE },
  );

  const pngBuffer = Buffer.from(await png.arrayBuffer());
  const jpegBuffer = await sharp(pngBuffer).jpeg({ quality: 90 }).toBuffer();

  return new Response(new Uint8Array(jpegBuffer), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate",
    },
  });
}
