/**
 * Asset pipeline.
 *
 * The source is ONE 10s / 720p / 24fps montage containing 7 distinct shots.
 * Cut points were measured frame-by-frame; each shot is trimmed ~2 frames
 * inside its boundary so no frame of the adjacent shot bleeds in.
 *
 * Two encodes are produced:
 *   - "loop"  : normal GOP, for muted autoplay loops.
 *   - "scrub" : all-intra (keyint=1), so scroll-driven currentTime seeks land
 *               on a keyframe every time. The source has only 7 keyframes in
 *               240 frames, which makes it unscrubbable as shipped.
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";
import sharp from "sharp";
import { buildCatalogue } from "./build-catalogue.mjs";

const run = promisify(execFile);
const ROOT = path.resolve(import.meta.dirname, "..");
const SRC_VIDEO = path.join(ROOT, "media", "Generate_me_a_high_quality_D.mp4");
const OUT_VIDEO = path.join(ROOT, "public", "video");
const OUT_POSTER = path.join(ROOT, "public", "poster");
const OUT_IMG = path.join(ROOT, "public", "img");

/** Measured shot boundaries (seconds). */
export const SHOTS = [
  { id: 1, start: 0.0,  end: 1.46, mode: "loop",  name: "living-wide",        width: 1136 },
  { id: 2, start: 1.54, end: 2.96, mode: "scrub", name: "boucle-chair",       width: 960 },
  { id: 3, start: 3.04, end: 4.44, mode: "scrub", name: "linear-pendant",     width: 960 },
  { id: 4, start: 4.52, end: 5.92, mode: "loop",  name: "foliage-reveal",     width: 1136 },
  { id: 5, start: 6.0,  end: 7.34, mode: "scrub", name: "walnut-desk",        width: 960 },
  { id: 6, start: 7.42, end: 8.78, mode: "loop",  name: "modular-sofa",       width: 1136 },
  // Full bleed at the close, so it keeps the full source width.
  { id: 7, start: 8.86, end: 10.0, mode: "scrub", name: "penthouse-pullback", width: 1136 },
];

/** Frames per second of the scrub encodes; the player quantises seeks to this. */
export const SCRUB_FPS = 60;

const ff = (args) => run(ffmpegPath, ["-hide_banner", "-loglevel", "error", "-y", ...args], {
  maxBuffer: 1024 * 1024 * 64,
});

const COMMON = ["-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", "-sn", "-map_metadata", "-1"];

/**
 * The source carries a generative-AI sparkle watermark burned into every frame:
 * measured at 46x46px spanning x 1137-1182, y 577-622 on the 1280x720 frame
 * (a 97px inset from both the right and bottom edge). Cropping the right 144px
 * removes it outright while keeping full vertical detail. Result: 1136x720.
 */
const CROP = "crop=1136:720:0:0";

async function encodeShot(shot) {
  const dur = (shot.end - shot.start).toFixed(3);
  const base = `shot-${String(shot.id).padStart(2, "0")}-${shot.name}`;
  const scrub = shot.mode === "scrub";

  /**
   * Scrub clips were 12fps all-intra, which gave a 1.4s shot only ~17 frames.
   * Mapped across a tall section that is one frame per ~138px of scroll, and no
   * amount of smoothing hides that — it reads as stutter.
   *
   * Motion interpolation lifts them to 60fps, and a 4-frame GOP replaces
   * all-intra: seeking never decodes more than four frames, while the bitrate
   * drops far enough that ~5x the frames costs about the same bytes.
   */
  const vf = [
    CROP,
    scrub ? `minterpolate=fps=${SCRUB_FPS}:mi_mode=mci:mc_mode=aobmc:vsbmc=1` : null,
    `scale=${shot.width}:-2`,
    "scale=trunc(iw/2)*2:trunc(ih/2)*2",
  ]
    .filter(Boolean)
    .join(",");

  const codec = scrub
    ? ["-c:v", "libx264", "-preset", "veryslow", "-crf", "26",
       "-x264-params", "keyint=4:min-keyint=4:scenecut=0:bframes=0"]
    : ["-c:v", "libx264", "-preset", "veryslow", "-crf", "22", "-g", "24"];

  const out = path.join(OUT_VIDEO, `${base}.mp4`);
  await ff(["-ss", String(shot.start), "-i", SRC_VIDEO, "-t", dur, "-vf", vf, ...codec, ...COMMON, out]);

  // Poster: a frame ~15% into the shot reads better than the very first frame.
  const posterAt = shot.start + (shot.end - shot.start) * 0.15;
  const posterTmp = path.join(OUT_POSTER, `${base}.png`);
  await ff(["-ss", String(posterAt), "-i", SRC_VIDEO, "-frames:v", "1", "-vf", vf, posterTmp]);
  await sharp(posterTmp).jpeg({ quality: 74, mozjpeg: true })
    .toFile(path.join(OUT_POSTER, `${base}.jpg`));
  await run(process.execPath, ["-e", `require('fs').unlinkSync(${JSON.stringify(posterTmp)})`]);

  const { size } = await stat(out);
  return { base, mode: shot.mode, kb: Math.round(size / 1024) };
}

/** Explicit semantic slugs — three source files share a photographer prefix. */
const IMAGE_MAP = {
  "sofa/inside-weather-Uxqlfigh6oE-unsplash.jpg":          "arch-portal",
  "interior/jean-philippe-delberghe-90eBoEp2tS0-unsplash.jpg": "fluted-wall",
  "interior/jean-philippe-delberghe-Ry9WBo3qmoc-unsplash.jpg": "copper-pendants",
  "sofa/jean-philippe-delberghe-T5BF4OyQLwU-unsplash.jpg": "terracotta-settee",
  "sofa/prydumano-design-VZ2z8ozzy10-unsplash.jpg":        "olive-sectional",
  "sofa/roberto-nickson-rEJxpBskj3Q-unsplash.jpg":         "loft-dusk",
  "bed/spacejoy-eyEy5YZhSvU-unsplash.jpg":                 "bedroom-brass",
};

async function prepImages() {
  const srcDir = path.join(ROOT, "image");
  // Editorial stills now live inside the category folders, so the map keys are
  // "<category>/<file>" rather than bare filenames.
  const files = Object.keys(IMAGE_MAP);
  const results = [];
  for (const f of files) {
    const slug = IMAGE_MAP[f];
    if (!slug) {
      console.warn(`skipped (no slug mapped): ${f}`);
      continue;
    }
    // limitInputPixels: the arch-portal master is 179 megapixels.
    const img = sharp(path.join(srcDir, f), { limitInputPixels: false });
    const meta = await img.metadata();
    const out = path.join(OUT_IMG, `${slug}.jpg`);
    await img
      .rotate()
      .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true, chromaSubsampling: "4:4:4" })
      .toFile(out);
    const after = await sharp(out).metadata();
    const { size } = await stat(out);
    results.push({
      slug,
      from: `${meta.width}x${meta.height}`,
      to: `${after.width}x${after.height}`,
      kb: Math.round(size / 1024),
    });
  }
  return results;
}

async function main() {
  await Promise.all([OUT_VIDEO, OUT_POSTER, OUT_IMG].map((d) => mkdir(d, { recursive: true })));

  const vids = [];
  for (const s of SHOTS) vids.push(await encodeShot(s));
  console.table(vids);

  const imgs = await prepImages();
  console.table(imgs);

  // Products are derived from the folders under image/, never listed in code.
  await buildCatalogue();

  await writeFile(
    path.join(ROOT, "src", "lib", "shots.generated.json"),
    JSON.stringify(
      SHOTS.map((s) => ({
        ...s,
        fps: s.mode === "scrub" ? SCRUB_FPS : 24,
        duration: +(s.end - s.start).toFixed(3),
        src: `/video/shot-${String(s.id).padStart(2, "0")}-${s.name}.mp4`,
        poster: `/poster/shot-${String(s.id).padStart(2, "0")}-${s.name}.jpg`,
      })),
      null,
      2
    ) + "\n"
  );
  console.log("wrote src/lib/shots.generated.json");
}

main().catch((e) => { console.error(e); process.exit(1); });
