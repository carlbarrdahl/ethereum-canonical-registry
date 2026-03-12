import { ImageResponse } from "next/og";

// Image metadata
export const alt = "Entity Registry - Off-chain entity registry";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

// Image generation
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 64,
          background: "linear-gradient(to bottom right, #1e293b, #0f172a)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px",
          color: "white",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "24px",
          }}
        >
          <div
            style={{
              fontSize: 80,
              fontWeight: "bold",
              background: "linear-gradient(to right, #3b82f6, #8b5cf6)",
              backgroundClip: "text",
              color: "transparent",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Entity Registry
          </div>
          <div
            style={{
              fontSize: 40,
              color: "#94a3b8",
              textAlign: "center",
              maxWidth: "900px",
            }}
          >
            Off-chain entity registry
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#64748b",
              textAlign: "center",
              maxWidth: "800px",
              marginTop: "16px",
            }}
          >
            Maps off-chain identifiers to Ethereum addresses. Any protocol can read it. Any entity can register.
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
