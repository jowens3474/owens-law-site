import { ImageResponse } from "next/og";

// Browser-tab favicon: a "JW" monogram in the publication's crimson.
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#8a1c1c",
          color: "#fffdf8",
          fontSize: 38,
          fontWeight: 700,
          letterSpacing: -2,
        }}
      >
        JW
      </div>
    ),
    { ...size },
  );
}
