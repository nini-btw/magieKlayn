import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Same crown/wing mark as app/icon.tsx, just re-sized for the apple-touch
// icon slot — see that file for where these paths come from.
const MARK_PATHS = [
  "M85.3549 121.3206 99.7909 104.0466 114.2259 121.3206V115.0896L122.8629 121.8756V127.5516H110.0309L99.7909 115.2136 89.5499 127.5516H76.7179V121.8756L85.3549 115.0896Z",
  "M152.9684 127.5515H136.0654L99.7904 98.8035 63.5164 127.5515H46.6124L89.5504 93.2515H46.6124V88.5535H99.7904 152.9684V93.2515H110.0314Z",
];

const MARK_VIEWBOX = "46.6124 17.8164 106.356 38.998";
const MARK_ASPECT_RATIO = 38.998 / 106.356;
const MARK_WIDTH = 130;
const MARK_HEIGHT = MARK_WIDTH * MARK_ASPECT_RATIO;

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
        }}
      >
        <svg
          width={MARK_WIDTH}
          height={MARK_HEIGHT}
          viewBox={MARK_VIEWBOX}
          xmlns="http://www.w3.org/2000/svg"
        >
          <g transform="matrix(1,0,0,-1,0,145.368)">
            {MARK_PATHS.map((d) => (
              <path key={d} d={d} fill="#231f20" />
            ))}
          </g>
        </svg>
      </div>
    ),
    { ...size },
  );
}
