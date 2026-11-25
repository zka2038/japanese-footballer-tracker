import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { seasonHeadline, snapshot } from "@/lib/data";

const fontDir = join(process.cwd(), "node_modules/@fontsource/inter/files");

export const alt = "Kaigai — every Japanese footballer in Europe";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const [semibold, bold] = await Promise.all([
    readFile(join(fontDir, "inter-latin-600-normal.woff")),
    readFile(join(fontDir, "inter-latin-700-normal.woff")),
  ]);
  const head = seasonHeadline();
  const season = snapshot().season.replace("/20", "/");
  const stats = [
    { label: "Players", value: head.players },
    { label: "Goals", value: head.goals },
    { label: "Assists", value: head.assists },
    { label: "Appearances", value: head.apps },
  ];
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#000",
          color: "#f5f5f7",
          position: "relative",
          fontFamily: "Inter",
          fontWeight: 600,
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -120,
            top: -120,
            width: 620,
            height: 620,
            borderRadius: 9999,
            background: "radial-gradient(circle, rgba(255,59,92,0.55), rgba(255,59,92,0) 70%)",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30, fontWeight: 600 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9999,
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: 17, height: 17, borderRadius: 9999, background: "#bc002d" }} />
          </div>
          Kaigai
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 26, color: "#ff3b5c", fontWeight: 600 }}>{`${season} season`}</div>
          <div style={{ fontSize: 92, fontWeight: 700, letterSpacing: -3, lineHeight: 1.02, marginTop: 12 }}>
            Samurai Blue,
          </div>
          <div style={{ fontSize: 92, fontWeight: 700, letterSpacing: -3, lineHeight: 1.02, color: "#a1a1a6" }}>
            all over Europe.
          </div>
        </div>
        <div style={{ display: "flex", gap: 72 }}>
          {stats.map((s) => (
            <div key={s.label} style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 22, color: "#86868b" }}>{s.label}</div>
              <div style={{ fontSize: 56, fontWeight: 600, letterSpacing: -2 }}>{s.value.toLocaleString("en-GB")}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Inter", data: semibold, weight: 600, style: "normal" },
        { name: "Inter", data: bold, weight: 700, style: "normal" },
      ],
    },
  );
}
