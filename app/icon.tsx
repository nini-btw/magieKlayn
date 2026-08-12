import { ImageResponse } from "next/og";

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
          background: "linear-gradient(155deg, #e2264a 0%, #a3172c 100%)",
          color: "#ffffff",
          fontFamily: "serif",
          fontSize: 36,
          fontWeight: 700,
        }}
      >
        M
      </div>
    ),
    { ...size },
  );
}
