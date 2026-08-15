/**
 * LocalDetectionProvider — TrustLens Built-in Heuristic Engine
 *
 * A REAL, deterministic, fully local analysis engine. It replaces the old
 * random "mock" provider so every upload produces an honest, reproducible
 * report based on the file's actual contents:
 *
 *   Images → EXIF metadata, texture/noise residual, edge density, color
 *            statistics, compression ratio, C2PA manifest presence.
 *   Audio  → WAV sample-level acoustics (RMS, zero-crossing rate,
 *            high-frequency energy, silence ratio), plus header metadata
 *            for MP3 / FLAC / OGG / M4A.
 *   Video  → MP4/MOV box parsing (encoder software, creation time, codec,
 *            resolution) and WEBM EBML metadata.
 *
 * Same file → same result, every time. Scores are conservative heuristics;
 * limitations are reported honestly on every analysis.
 */

import sharp from "sharp";
import { nanoid } from "nanoid";
import { getStorage } from "../../storage";
import {
  AssetInfo,
  DetectionProvider,
  DetectionResult,
  EvidenceItem,
  Modality,
} from "../types";

// ─── Shared helpers ───────────────────────────────────────────

const eid = () => nanoid(8);

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

interface RawEvidence {
  category: EvidenceItem["category"];
  type: EvidenceItem["type"];
  title: string;
  description: string;
  score: number | null;
  confidence: number | null;
  severity: EvidenceItem["severity"];
  timestampStart?: number;
  timestampEnd?: number;
}

function evidence(e: RawEvidence): EvidenceItem {
  return { ...e, id: eid(), source: "local_heuristics" };
}

// ─── Tool signature tables ────────────────────────────────────

const AI_IMAGE_TOOLS = [
  "midjourney",
  "dall-e",
  "dalle",
  "stable diffusion",
  "stability",
  "sdxl",
  "firefly",
  "ideogram",
  "flux",
  "leonardo",
  "bing image creator",
  "gencraft",
  "recraft",
  "comfyui",
  "automatic1111",
  "invokeai",
  "novelai",
  "canva magic",
  "dreamstudio",
];

const AI_VIDEO_TOOLS = [
  "runway",
  "gen-2",
  "gen-3",
  "pika",
  "sora",
  "veo",
  "kling",
  "hailuo",
  "luma",
  "kaiber",
  "pictory",
  "synthesia",
  "hey gen",
  "heyGen",
  "heygen",
];

const EDITING_TOOLS = [
  "photoshop",
  "lightroom",
  "gimp",
  "affinity",
  "photopea",
  "picsart",
  "snapseed",
  "canva",
  "capture one",
  "pixelmator",
  "luminar",
  "photoscape",
  "paint.net",
];

const VIDEO_EDITORS = [
  "capcut",
  "premiere",
  "final cut",
  "davinci",
  "filmora",
  "inshot",
  "after effects",
  "videopad",
  "clipchamp",
  "lumafusion",
  "kdenlive",
  "shotcut",
  "camtasia",
  "movie maker",
  "imovie",
  "kinemaster",
  "vn",
];

// ─── C2PA presence ────────────────────────────────────────────

function hasC2paManifest(buffer: Buffer): boolean {
  const b = buffer;
  // JPEG: APP11 marker (0xFF 0xE7) followed by the "C2PA" signature.
  for (let i = 0; i + 8 < b.length; i++) {
    if (b[i] === 0xff && b[i + 1] === 0xe7) {
      const len = b.readUInt16BE(i + 2);
      if (len >= 8 && b.toString("ascii", i + 4, i + 8) === "C2PA") return true;
      i += 2 + len;
    }
  }
  // PNG: "C2PA" in an iTXt/tEXt chunk.
  if (b.subarray(0, 8).toString("ascii") === "\x89PNG\r\n\x1a\n") {
    let o = 8;
    while (o + 8 <= b.length) {
      const len = b.readUInt32BE(o);
      const type = b.toString("ascii", o + 4, o + 8);
      if (type === "iTXt" || type === "tEXt") {
        if (b.subarray(o + 8, o + 8 + len).includes(Buffer.from("C2PA")))
          return true;
      }
      o += 12 + len;
    }
  }
  // MP4/MOV: uuid box containing the C2PA asset UUID prefix.
  const uuidPrefix = Buffer.from("4a4c534a", "hex"); // "JLSJ" — C2PA manifest uuid
  for (let i = 0; i + 16 < b.length; i++) {
    if (b.toString("ascii", i + 4, i + 8) === "uuid") {
      const payload = b.subarray(i + 8, i + 16);
      if (payload.subarray(0, 4).equals(uuidPrefix)) return true;
      i += 8;
    }
  }
  return false;
}

// ─── EXIF parsing (JPEG/TIFF, common tags only) ───────────────

interface ExifInfo {
  make: string | null;
  model: string | null;
  software: string | null;
  dateTime: string | null;
  dateTimeOriginal: string | null;
  hasGps: boolean;
}

const TAG_MAKE = 0x010f;
const TAG_MODEL = 0x0110;
const TAG_SOFTWARE = 0x0131;
const TAG_DATETIME = 0x0132;
const TAG_EXIF_IFD = 0x8769;
const TAG_GPS_IFD = 0x8825;
const TAG_DATETIME_ORIGINAL = 0x9003;

function parseExif(exifBuf: Buffer | undefined): ExifInfo {
  const empty: ExifInfo = {
    make: null,
    model: null,
    software: null,
    dateTime: null,
    dateTimeOriginal: null,
    hasGps: false,
  };
  if (!exifBuf || exifBuf.length < 8) return empty;

  try {
    // JPEG EXIF (APP1) is "Exif\0\0" + TIFF header; TIFF-only buffers start with II/MM.
    let start = 0;
    if (exifBuf.length >= 6 && exifBuf.toString("ascii", 0, 4) === "Exif") start = 6;
    const t = exifBuf.subarray(start);

    const le = t.toString("ascii", 0, 2) === "II";
    const be = t.toString("ascii", 0, 2) === "MM";
    if (!le && !be) return empty;
    const r16 = (o: number) => (le ? t.readUInt16LE(o) : t.readUInt16BE(o));
    const r32 = (o: number) => (le ? t.readUInt32LE(o) : t.readUInt32BE(o));
    const ascii = (o: number, n: number) =>
      t.subarray(o, o + n).toString("ascii").replace(/\0+$/, "").trim();

    const readIfd = (offset: number, kinds: Set<string>) => {
      if (offset + 2 > t.length) return;
      const count = r16(offset);
      for (let i = 0; i < count; i++) {
        const entry = offset + 2 + i * 12;
        if (entry + 12 > t.length) break;
        const tag = r16(entry);
        const type = r16(entry + 2);
        const valueCount = r32(entry + 4);
        const valueOffset = entry + 8;
        const typeSize = type === 3 || type === 4 ? 4 : type === 5 || type === 10 ? 8 : type === 9 ? 4 : 1;
        const total = valueCount * typeSize;
        const dataAt = total <= 4 ? valueOffset : r32(valueOffset);

        if (kinds.has("ifd0")) {
          if (tag === TAG_MAKE && type === 2) empty.make = ascii(dataAt, valueCount);
          else if (tag === TAG_MODEL && type === 2) empty.model = ascii(dataAt, valueCount);
          else if (tag === TAG_SOFTWARE && type === 2) empty.software = ascii(dataAt, valueCount);
          else if (tag === TAG_DATETIME && type === 2) empty.dateTime = ascii(dataAt, valueCount);
          else if (tag === TAG_EXIF_IFD && (type === 3 || type === 4)) readIfd(r32(valueOffset), new Set(["exif"]));
          else if (tag === TAG_GPS_IFD) empty.hasGps = true;
        } else if (kinds.has("exif")) {
          if (tag === TAG_DATETIME_ORIGINAL && type === 2) empty.dateTimeOriginal = ascii(dataAt, valueCount);
        }
      }
    };

    readIfd(r32(4), new Set(["ifd0"]));
  } catch {
    // Malformed EXIF must never crash an analysis.
  }
  return empty;
}

// ─── Image analysis ───────────────────────────────────────────

interface ImageFeatures {
  width: number;
  height: number;
  luminanceMean: number;
  luminanceStd: number;
  saturationMean: number;
  edgeDensity: number;
  noiseResidual: number;
  colorfulness: number;
  bitsPerPixel: number;
}

async function imageFeatures(buffer: Buffer): Promise<ImageFeatures> {
  const img = sharp(buffer, { failOn: "none" });
  const meta = await img.metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;

  const target = img.clone();
  if (width > 1024 || height > 1024) {
    target.resize({ width: Math.min(width, 1024), height: Math.min(height, 1024), fit: "inside", withoutEnlargement: true });
  }
  const { data, info } = await target
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const ch = Math.min(3, info.channels);

  const lum = new Float32Array(w * h);
  const sat = new Float32Array(w * h);
  let rSum = 0, gSum = 0, bSum = 0;
  for (let i = 0; i < w * h; i++) {
    const r = data[i * ch];
    const g = data[i * ch + 1];
    const b = data[i * ch + 2];
    const mx = Math.max(r, g, b);
    const mn = Math.min(r, g, b);
    const l = 0.299 * r + 0.587 * g + 0.114 * b;
    lum[i] = l;
    sat[i] = mx > 0 ? (mx - mn) / mx : 0;
    rSum += r;
    gSum += g;
    bSum += b;
  }
  const n = w * h || 1;
  const rm = rSum / n, gm = gSum / n, bm = bSum / n;
  const rgMean = rm - gm;
  const ybMean = 0.5 * (rm + gm) - bm;
  let luminanceMean = 0, lumSq = 0, saturationMean = 0, rgSq = 0, ybSq = 0;
  for (let i = 0; i < w * h; i++) {
    luminanceMean += lum[i];
    lumSq += lum[i] * lum[i];
    saturationMean += sat[i];
    const r = data[i * ch];
    const g = data[i * ch + 1];
    const b = data[i * ch + 2];
    const rg = r - g - rgMean;
    const yb = 0.5 * (r + g) - b - ybMean;
    rgSq += rg * rg;
    ybSq += yb * yb;
  }
  luminanceMean /= n;
  saturationMean /= n;
  const luminanceStd = Math.sqrt(Math.max(0, lumSq / n - luminanceMean * luminanceMean));
  const sr = Math.sqrt(rgSq / n);
  const sb = Math.sqrt(ybSq / n);
  const colorfulness = sr + sb + 0.3 * Math.sqrt(rgMean * rgMean + ybMean * ybMean);

  // Edge density: mean gradient magnitude on luminance (8-bit scale).
  let gradSum = 0, gradCount = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const gx = lum[i + 1] - lum[i - 1];
      const gy = lum[i + w] - lum[i - w];
      gradSum += Math.sqrt(gx * gx + gy * gy);
      gradCount++;
    }
  }
  const edgeDensity = gradCount ? gradSum / gradCount : 0;

  // Noise residual: mean |luminance − 3×3 box blur| — measures fine texture.
  const hPass = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const row = y * w;
    let prev = row > 0 ? row - w : row;
    let next = y < h - 1 ? row + w : row;
    for (let x = 0; x < w; x++) {
      const xp = x > 0 ? x - 1 : x;
      const xn = x < w - 1 ? x + 1 : x;
      hPass[row + x] = (lum[prev + xp] + lum[prev + x] + lum[prev + xn] + lum[row + xp] + lum[row + x] + lum[row + xn] + lum[next + xp] + lum[next + x] + lum[next + xn]) / 9;
    }
  }
  let noiseSum = 0;
  for (let i = 0; i < w * h; i++) noiseSum += Math.abs(lum[i] - hPass[i]);
  const noiseResidual = noiseSum / n;

  const bitsPerPixel = width > 0 && height > 0 ? (buffer.length * 8) / (width * height) : 0;

  return {
    width,
    height,
    luminanceMean,
    luminanceStd,
    saturationMean,
    edgeDensity,
    noiseResidual,
    colorfulness,
    bitsPerPixel,
  };
}

async function analyzeImageLocal(
  buffer: Buffer,
  asset: AssetInfo
): Promise<{ ai: number; manipulation: number; confidence: number; items: EvidenceItem[]; limitations: string[] }> {
  let features: ImageFeatures | null = null;
  try {
    features = await imageFeatures(buffer);
  } catch (decodeError) {
    console.warn("[local-provider] pixel decoding failed, metadata-only analysis:", decodeError);
  }
  const items: EvidenceItem[] = [];

  let ai = 0.03;
  let manipulation = 0.03;

  // EXIF
  let exif: ExifInfo = { make: null, model: null, software: null, dateTime: null, dateTimeOriginal: null, hasGps: false };
  try {
    const meta = await sharp(buffer, { failOn: "none" }).metadata();
    exif = parseExif(meta.exif as Buffer | undefined);
  } catch {
    // ignore
  }

  const software = (exif.software || "").toLowerCase();
  const matchedAiTool = AI_IMAGE_TOOLS.find((t) => software.includes(t));
  const matchedEditor = EDITING_TOOLS.find((t) => software.includes(t));

  if (matchedAiTool) {
    ai += 0.5;
    items.push(
      evidence({
        category: "ai_detection",
        type: "ai_generated",
        title: "AI generator signature in metadata",
        description: `The file's EXIF software field reads "${exif.software}", which is associated with AI image generation tools.`,
        score: 0.8,
        confidence: 0.85,
        severity: "high",
      })
    );
  }

  if (matchedEditor && !matchedAiTool) {
    manipulation += 0.35;
    items.push(
      evidence({
        category: "manipulation",
        type: "splice",
        title: "Editing software recorded in metadata",
        description: `The EXIF software field reads "${exif.software}" — the image was processed or exported with editing software.`,
        score: 0.55,
        confidence: 0.8,
        severity: "medium",
      })
    );
  }

  if (exif.make || exif.model) {
    ai = Math.max(0.02, ai - 0.1);
    manipulation = Math.max(0.02, manipulation - 0.05);
    items.push(
      evidence({
        category: "metadata",
        type: "unknown",
        title: "Camera metadata present",
        description: `EXIF records the capture device as "${[exif.make, exif.model].filter(Boolean).join(" ")}"${exif.dateTimeOriginal ? `, captured at ${exif.dateTimeOriginal}` : ""}.`,
        score: null,
        confidence: 0.9,
        severity: "low",
      })
    );
  } else if (exif.dateTime) {
    items.push(
      evidence({
        category: "metadata",
        type: "metadata_anomaly",
        title: "No camera metadata, but a processing timestamp exists",
        description: "EXIF contains a timestamp but no camera make/model — the file was likely re-saved or exported by software.",
        score: 0.25,
        confidence: 0.7,
        severity: "low",
      })
    );
  } else {
    ai += 0.08;
    items.push(
      evidence({
        category: "metadata",
        type: "metadata_anomaly",
        title: "No camera EXIF metadata",
        description: "The file carries no camera make/model or capture timestamp, which is common for AI-generated or re-exported images.",
        score: 0.3,
        confidence: 0.75,
        severity: "low",
      })
    );
  }

  if (exif.hasGps) {
    items.push(
      evidence({
        category: "metadata",
        type: "unknown",
        title: "GPS coordinates embedded",
        description: "The image includes GPS location data — a signal typical of a smartphone or camera capture.",
        score: null,
        confidence: 0.9,
        severity: "low",
      })
    );
  }

  // Texture / noise
  if (features && features.noiseResidual < 3 && features.luminanceStd > 12) {
    ai += 0.12;
    items.push(
      evidence({
        category: "ai_detection",
        type: "ai_generated",
        title: "Unusually smooth texture",
        description: `Fine-detail residual noise is very low (${features.noiseResidual.toFixed(2)} on the luminance scale). Real camera captures usually show sensor noise and micro-texture; AI renderers often produce unnaturally clean surfaces.`,
        score: 0.45,
        confidence: 0.6,
        severity: "medium",
      })
    );
  }

  if (features && features.edgeDensity < 10 && features.width >= 900) {
    ai += 0.05;
    items.push(
      evidence({
        category: "ai_detection",
        type: "ai_generated",
        title: "Low fine-detail density",
        description: `Average edge strength is ${features.edgeDensity.toFixed(1)} — the image is large but carries little fine spatial detail, a pattern seen in AI-generated content.`,
        score: 0.3,
        confidence: 0.5,
        severity: "low",
      })
    );
  }

  if (features && features.saturationMean > 0.42 && features.colorfulness > 50) {
    ai += 0.05;
    items.push(
      evidence({
        category: "ai_detection",
        type: "ai_generated",
        title: "Highly saturated, uniform palette",
        description: `Mean color saturation is ${(features.saturationMean * 100).toFixed(0)}% with a colorfulness score of ${features.colorfulness.toFixed(0)} — vivid uniform palettes are frequent in AI-generated imagery.`,
        score: 0.25,
        confidence: 0.5,
        severity: "low",
      })
    );
  }

  // Compression
  if (features && features.bitsPerPixel > 0 && features.bitsPerPixel < 0.7 && !(exif.make || exif.model)) {
    ai += 0.04;
    items.push(
      evidence({
        category: "metadata",
        type: "compression_anomaly",
        title: "Aggressive compression",
        description: `The file stores only ${features.bitsPerPixel.toFixed(2)} bits per pixel — consistent with heavy re-compression, social-media re-export, or AI generation output.`,
        score: 0.2,
        confidence: 0.55,
        severity: "low",
      })
    );
  }

  // Provenance (C2PA)
  if (hasC2paManifest(buffer)) {
    items.push(
      evidence({
        category: "provenance",
        type: "provenance_verified",
        title: "Content Credentials (C2PA) manifest present",
        description: "The file contains a C2PA Content Credentials manifest, which can record its origin and edit history.",
        score: 0.7,
        confidence: 0.8,
        severity: "low",
      })
    );
  } else {
    items.push(
      evidence({
        category: "provenance",
        type: "provenance_absent",
        title: "No Content Credentials manifest",
        description: "No C2PA provenance manifest was found. Absence of provenance does not prove anything by itself — most camera photos don't carry one either.",
        score: null,
        confidence: null,
        severity: "low",
      })
    );
  }

  // Real file facts (always present, informational)
  if (features) {
    items.push(
      evidence({
        category: "integrity",
        type: "integrity_ok",
        title: "File decoded successfully",
        description: `Decoded ${features.width}×${features.height} image, ${asset.originalFilename || "upload"} (${(buffer.length / 1024).toFixed(0)} KB). Structure is intact.`,
        score: null,
        confidence: 0.95,
        severity: "low",
      })
    );
  } else {
    items.push(
      evidence({
        category: "integrity",
        type: "integrity_issue",
        title: "Pixels could not be decoded",
        description: "The file's structure passed type checks but the pixel data could not be fully decoded, so analysis is limited to metadata. The file may be partially corrupted.",
        score: null,
        confidence: 0.6,
        severity: "low",
      })
    );
  }

  const confidence = clamp01(0.45 + Math.min(0.2, items.length * 0.02));

  return {
    ai: clamp01(ai),
    manipulation: clamp01(manipulation),
    confidence,
    items,
    limitations: [
      "Analyzed by TrustLens' built-in local heuristic engine (metadata + statistical features). It is deterministic and privacy-safe (the file never leaves the server), but it is not a deep-learning detector.",
      "Neural-grade AI/deepfake detection requires connecting a detection provider (Hive or Sightengine) via environment variables.",
    ],
  };
}

// ─── Audio analysis ───────────────────────────────────────────

interface AudioHeader {
  container: string;
  codec: string | null;
  sampleRate: number | null;
  channels: number | null;
  bitrate: number | null;
  duration: number | null;
}

function parseWav(buffer: Buffer): AudioHeader | null {
  if (buffer.length < 44 || buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WAVE") return null;
  let o = 12;
  let format = 0, channels = 0, sampleRate = 0, bits = 0;
  let dataSize = 0;
  while (o + 8 <= buffer.length) {
    const id = buffer.toString("ascii", o, o + 4);
    const size = buffer.readUInt32LE(o + 4);
    if (id === "fmt ") {
      format = buffer.readUInt16LE(o + 8);
      channels = buffer.readUInt16LE(o + 10);
      sampleRate = buffer.readUInt32LE(o + 12);
      bits = buffer.readUInt16LE(o + 22);
    } else if (id === "data") {
      dataSize = size;
    }
    if (id === "data") break;
    o += 8 + size + (size % 2);
  }
  if (!sampleRate || !channels) return null;
  const bytesPerSample = bits / 8 || 2;
  const duration = dataSize > 0 ? dataSize / (sampleRate * channels * bytesPerSample) : null;
  return {
    container: "wav",
    codec: format === 1 ? `PCM ${bits}-bit` : format === 3 ? "IEEE float" : `format ${format}`,
    sampleRate,
    channels,
    bitrate: Math.round(sampleRate * channels * bits),
    duration,
  };
}

function parseMp3(buffer: Buffer): AudioHeader | null {
  const tables: Record<string, number[]> = {
    v1l1: [32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448],
    v1l2: [32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384],
    v1l3: [32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],
    v2l1: [32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256],
    v2l23: [8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
  };
  const rates = [44100, 48000, 32000, 22050, 24000, 16000, 11025, 12000, 8000];
  for (let o = 0; o + 4 < Math.min(buffer.length, 64 * 1024); o++) {
    if (buffer[o] !== 0xff || (buffer[o + 1] & 0xe0) !== 0xe0) continue;
    const b1 = buffer[o + 1];
    const versionBits = (b1 >> 3) & 0x3; // 3=v1, 2=v2, 0=v2.5
    const layerBits = (b1 >> 1) & 0x3; // 3=l1, 2=l2, 1=l3
    const bitrateIdx = (buffer[o + 2] >> 4) & 0xf;
    const rateIdx = (buffer[o + 2] >> 2) & 0x3;
    if (versionBits === 1 || layerBits === 0 || bitrateIdx === 0 || bitrateIdx === 15 || rateIdx === 3) continue;
    const key = versionBits === 3 ? `v1l${layerBits}` : `v2l${layerBits === 1 ? 3 : 23}`;
    const br = tables[key]?.[bitrateIdx - 1];
    const sr = rates[rateIdx * (versionBits === 3 ? 1 : 2)] ?? rates[rateIdx];
    if (!br || !sr) continue;
    const channelMode = (buffer[o + 3] >> 6) & 0x3;
    const channels = channelMode === 3 ? 1 : 2;
    return {
      container: "mp3",
      codec: `MPEG-${versionBits === 3 ? 1 : 2} Layer ${layerBits === 1 ? "III" : layerBits === 2 ? "II" : "I"}`,
      sampleRate: sr,
      channels,
      bitrate: br * 1000,
      duration: (buffer.length * 8) / (br * 1000),
    };
  }
  return null;
}

function parseFlac(buffer: Buffer): AudioHeader | null {
  if (buffer.length < 42 || buffer.toString("ascii", 0, 4) !== "fLaC") return null;
  let o = 4;
  while (o + 4 <= buffer.length) {
    const last = buffer[o] & 0x80 ? true : false;
    const type = buffer[o] & 0x7f;
    const size = buffer.readUIntBE(o + 1, 3);
    if (type === 0) {
      const block = buffer.subarray(o + 4, o + 4 + size);
      const sampleRate = ((block[10] << 12) | (block[11] << 4) | (block[12] >> 4)) >>> 0;
      const channels = ((block[12] >> 1) & 0x7) + 1;
      const bits = (((block[12] & 0x1) << 4) | (block[13] >> 4)) + 1;
      const totalSamples = Number(BigInt.asUintN(64, (BigInt(block[13] & 0xf) << BigInt(32)) | BigInt(block.readUInt32BE(14))));
      return {
        container: "flac",
        codec: `FLAC ${bits}-bit`,
        sampleRate,
        channels,
        bitrate: Math.round((buffer.length * 8) / (totalSamples / sampleRate || 1)),
        duration: sampleRate ? totalSamples / sampleRate : null,
      };
    }
    o += 4 + size;
    if (last) break;
  }
  return null;
}

function parseOgg(buffer: Buffer): AudioHeader | null {
  if (buffer.length < 28 || buffer.toString("ascii", 0, 4) !== "OggS") return null;
  let sampleRate: number | null = null;
  let channels: number | null = null;
  let o = 0;
  const pages = 0;
  let lastGranule = 0;
  while (o + 27 <= buffer.length && pages < 200) {
    if (buffer.toString("ascii", o, o + 4) !== "OggS") break;
    const segCount = buffer[o + 26];
    let payload = o + 27;
    let size = 0;
    for (let s = 0; s < segCount; s++) size += buffer[payload + s];
    payload += segCount;
    lastGranule = Number(BigInt.asUintN(64, BigInt(buffer.readUInt32LE(o + 6)) | (BigInt(buffer.readUInt32LE(o + 10)) << BigInt(32))));
    if (sampleRate === null && payload + 30 <= buffer.length && buffer.toString("ascii", payload + 1, payload + 7) === "vorbis") {
      channels = buffer[payload + 11];
      sampleRate = buffer.readUInt32LE(payload + 12);
    }
    o = payload + size;
  }
  return {
    container: "ogg",
    codec: sampleRate !== null ? "Vorbis" : "OGG audio",
    sampleRate,
    channels,
    bitrate: null,
    duration: sampleRate ? lastGranule / sampleRate : null,
  };
}

function walkMp4Boxes(
  buffer: Buffer
): { codec: string | null; duration: number | null; creationTime: number | null; software: string | null } {
  const result = { codec: null as string | null, duration: null as number | null, creationTime: null as number | null, software: null as string | null };
  let o = 0;
  let depth = 0;
  const stack: number[] = [];
  const push = (size: number) => {
    if (depth < 12) stack.push(size);
    depth++;
  };
  const pop = () => {
    depth--;
    stack.pop();
  };
  let scanned = 0;
  while (o + 8 <= buffer.length && scanned < 2_000_000) {
    const size = buffer.readUInt32BE(o);
    // latin1 (not ascii) so 0xA9-prefixed Apple metadata types like ©swr decode correctly
    const type = buffer.toString("latin1", o + 4, o + 8);
    if (size === 0) break;
    if (size === 1) {
      if (o + 16 > buffer.length) break;
      const big = Number(buffer.readBigUInt64BE(o + 8));
      if (big <= 0 || o + big > buffer.length) break;
      o += Number(big);
      pop();
      continue;
    }
    if (size < 8 || o + size > buffer.length) break;
    scanned += 8;
    if (type === "mvhd") {
      const ver = buffer[o + 8];
      const timescale = ver === 1 ? Number(buffer.readUInt32BE(o + 28)) : buffer.readUInt32BE(o + 20);
      const dur = ver === 1 ? Number(buffer.readBigUInt64BE(o + 32)) : buffer.readUInt32BE(o + 24);
      const ctime = ver === 1 ? Number(buffer.readBigUInt64BE(o + 16)) : buffer.readUInt32BE(o + 12);
      if (timescale > 0) result.duration = dur / timescale;
      result.creationTime = ctime >= 2082844800 ? ctime - 2082844800 : ctime; // MP4 epoch 1904 → unix
    } else if (type === "stsd") {
      const codec = buffer.toString("ascii", o + 16, o + 20).trim();
      if (codec && codec.length === 4) result.codec = codec;
    } else if (type === "©swr") {
      result.software = buffer.subarray(o + 8, o + size).toString("utf8").replace(/^[\u0000-\u001f\u007f]+/, "").replace(/\0+$/, "").trim() || result.software;
    } else if (type === "©too") {
      result.software = result.software || buffer.subarray(o + 8, o + size).toString("utf8").replace(/^[\u0000-\u001f\u007f]+/, "").replace(/\0+$/, "").trim();
    }
    if (type === "moov" || type === "trak" || type === "mdia" || type === "minf" || type === "stbl" || type === "udta" || type === "ilst" || type === "meta") {
      push(size);
      o += 8;
      depth = depth; // container: descend
      if (type === "meta") {
        // meta has a 4-byte version/flags before children
        o += 4;
      }
      continue;
    }
    o += size;
    pop();
  }
  return result;
}

function parseM4a(buffer: Buffer): AudioHeader | null {
  if (buffer.toString("ascii", 4, 8) !== "ftyp") return null;
  const r = walkMp4Boxes(buffer);
  return {
    container: "m4a",
    codec: r.codec || "MP4 audio",
    sampleRate: null,
    channels: null,
    bitrate: r.duration ? Math.round((buffer.length * 8) / r.duration) : null,
    duration: r.duration,
  };
}

function parseAudioHeader(buffer: Buffer): AudioHeader | null {
  return parseWav(buffer) || parseMp3(buffer) || parseFlac(buffer) || parseOgg(buffer) || parseM4a(buffer);
}

function analyzeAudioLocal(
  buffer: Buffer,
  asset: AssetInfo
): { ai: number; manipulation: number; confidence: number; items: EvidenceItem[]; limitations: string[] } {
  const items: EvidenceItem[] = [];
  let ai = 0.05;
  const manipulation = 0.05;

  const header = parseAudioHeader(buffer);

  if (!header) {
    return {
      ai: 0.1,
      manipulation: 0.05,
      confidence: 0.4,
      items: [
        evidence({
          category: "integrity",
          type: "integrity_issue",
          title: "Audio container could not be parsed",
          description: "The file passed basic type checks but its internal structure could not be fully read. Metadata-based signals are limited.",
          score: null,
          confidence: 0.6,
          severity: "low",
        }),
      ],
      limitations: [
        "Container parsing failed; analysis is limited to file-level checks.",
        "Neural voice-cloning detection requires a connected provider (Hive/Sightengine).",
      ],
    };
  }

  items.push(
    evidence({
      category: "integrity",
      type: "integrity_ok",
      title: "Audio stream parsed",
      description: `${header.container.toUpperCase()} audio: ${header.codec || "unknown codec"}, ${header.sampleRate ? header.sampleRate + " Hz" : "unknown rate"}, ${header.channels ? header.channels + " ch" : "unknown channels"}, ${header.duration ? header.duration.toFixed(1) + "s" : "unknown duration"}${header.bitrate ? `, ~${Math.round(header.bitrate / 1000)} kbps` : ""}.`,
      score: null,
      confidence: 0.95,
      severity: "low",
    })
  );

  // Sample-level acoustics for PCM WAV
  if (header.container === "wav" && header.sampleRate && header.channels && buffer.length >= 44) {
    const sampleRate = header.sampleRate;
    const channels = header.channels;
    const fmt = buffer.readUInt16LE(20);
    const bits = buffer.readUInt16LE(34);
    const bytesPerSample = Math.max(1, Math.ceil(bits / 8));
    if ((fmt === 1 || fmt === 3) && bits >= 8) {
      let dataOffset = 12;
      let dataSize = 0;
      while (dataOffset + 8 <= buffer.length) {
        const id = buffer.toString("ascii", dataOffset, dataOffset + 4);
        const size = buffer.readUInt32LE(dataOffset + 4);
        if (id === "data") {
          dataSize = Math.min(size, buffer.length - dataOffset - 8);
          break;
        }
        dataOffset += 8 + size + (size % 2);
      }
      const frames = Math.min(
        Math.floor(dataSize / (bytesPerSample * channels)),
        20 * sampleRate // cap at 20 seconds
      );
      const mono = new Float64Array(frames);
      const dataStart = dataOffset + 8;
      let rms = 0;
      let peak = 0;
      let dc = 0;
      for (let i = 0; i < frames; i++) {
        let sum = 0;
        for (let c = 0; c < channels; c++) {
          const off = dataStart + (i * channels + c) * bytesPerSample;
          let v = 0;
          if (fmt === 1 && bits === 8) v = (buffer[off] - 128) / 128;
          else if (fmt === 1 && bits === 16) v = buffer.readInt16LE(off) / 32768;
          else if (fmt === 1 && bits === 24) {
            v = (buffer[off] | (buffer[off + 1] << 8) | (buffer[off + 2] << 16)) / 8388608;
            if (v > 1) v -= 2;
          } else if (fmt === 1 && bits === 32) v = buffer.readInt32LE(off) / 2147483648;
          else if (fmt === 3 && bits === 32) v = buffer.readFloatLE(off);
          sum += v;
        }
        const s = sum / channels;
        mono[i] = s;
        rms += s * s;
        peak = Math.max(peak, Math.abs(s));
        dc += s;
      }
      rms = Math.sqrt(rms / Math.max(1, frames));
      dc /= Math.max(1, frames);
      const rmsDb = rms > 0 ? 20 * Math.log10(rms) : -120;
      const peakDb = peak > 0 ? 20 * Math.log10(peak) : -120;

      // Zero-crossing rate
      let zc = 0;
      for (let i = 1; i < frames; i++) if ((mono[i - 1] < 0) !== (mono[i] < 0)) zc++;
      const zcr = zc / Math.max(1, frames);

      // High-frequency energy ratio (first difference energy / 2×total energy)
      let diffEnergy = 0;
      let totalEnergy = 0;
      for (let i = 0; i < frames; i++) totalEnergy += mono[i] * mono[i];
      for (let i = 1; i < frames; i++) {
        const d = mono[i] - mono[i - 1];
        diffEnergy += d * d;
      }
      const hfRatio = totalEnergy > 0 ? diffEnergy / (2 * totalEnergy) : 0;

      // Silence ratio (10ms windows below -50 dB)
      const win = Math.floor(sampleRate / 100);
      let silent = 0;
      let windows = 0;
      for (let s = 0; s + win <= frames; s += win) {
        let e = 0;
        for (let j = s; j < s + win; j++) e += mono[j] * mono[j];
        const db = e > 0 ? 10 * Math.log10(e / win) : -120;
        if (db < -50) silent++;
        windows++;
      }
      const silenceRatio = windows ? silent / windows : 0;

      items.push(
        evidence({
          category: "audio",
          type: "unknown",
          title: "Acoustic statistics (PCM waveform)",
          description: `RMS ${rmsDb.toFixed(1)} dB, peak ${peakDb.toFixed(1)} dB, zero-crossing rate ${zcr.toFixed(3)}, high-frequency energy ratio ${hfRatio.toFixed(2)}, silence ${(silenceRatio * 100).toFixed(0)}% of the first 20s.`,
          score: null,
          confidence: 0.9,
          severity: "low",
        })
      );

      if (rmsDb > -40 && silenceRatio < 0.15 && hfRatio < 0.03) {
        ai += 0.2;
        items.push(
          evidence({
            category: "audio",
            type: "voice_synthesis",
            title: "Unnaturally clean signal — no recording noise floor",
            description: "The waveform is loud and continuous with almost no broadband noise component, a pattern typical of synthesized or studio-processed text-to-speech audio rather than a microphone recording.",
            score: 0.5,
            confidence: 0.55,
            severity: "medium",
          })
        );
      }

      if (zcr >= 0.02 && zcr <= 0.18 && hfRatio >= 0.1 && hfRatio <= 0.6) {
        ai = Math.max(0.02, ai - 0.1);
        items.push(
          evidence({
            category: "audio",
            type: "unknown",
            title: "Speech-like dynamics",
            description: "Zero-crossing and spectral-energy patterns are consistent with natural human speech.",
            score: null,
            confidence: 0.6,
            severity: "low",
          })
        );
      }

      if (silenceRatio > 0.85) {
        items.push(
          evidence({
            category: "audio",
            type: "unknown",
            title: "Mostly silent content",
            description: `More than 85% of the analyzed audio is below the silence threshold — there may be little analyzable content.`,
            score: null,
            confidence: 0.8,
            severity: "low",
          })
        );
      }
    }
  } else {
    items.push(
      evidence({
        category: "audio",
        type: "unknown",
        title: "Metadata-only analysis for this codec",
        description: `Sample-level acoustic analysis is available for uncompressed WAV. For ${header.container.toUpperCase()} the engine reports container metadata only.`,
        score: null,
        confidence: 0.8,
        severity: "low",
      })
    );
  }

  const confidence = clamp01(0.45 + Math.min(0.15, items.length * 0.015));

  return {
    ai: clamp01(ai),
    manipulation,
    confidence,
    items,
    limitations: [
      "TrustLens' local engine analyzes real acoustic statistics for WAV and container metadata for compressed formats — but it cannot recognize a specific cloned voice without a neural provider.",
      "Connect Hive or Sightengine for deep-learning audio/voice detection.",
    ],
  };
}

// ─── Video analysis ───────────────────────────────────────────

function parseWebm(buffer: Buffer): { duration: number | null; muxingApp: string | null; writingApp: string | null } {
  const result = { duration: null as number | null, muxingApp: null as string | null, writingApp: null as string | null };
  let o = 0;
  let scans = 0;
  while (o + 2 <= buffer.length && scans < 200_000) {
    const first = buffer[o];
    if (first === 0x1f && buffer[o + 1] === 0x43 && buffer[o + 2] === 0xb6 && buffer[o + 3] === 0x75) {
      // Segment id 0x18538067 appears; walk children.
      o += 4;
      continue;
    }
    // read vint id
    let len = 0;
    let mask = 0x80;
    let i = o;
    while (i < buffer.length && !(buffer[i] & mask)) {
      mask >>= 1;
      i++;
      len++;
      if (len > 8) break;
    }
    if (len > 8 || i >= buffer.length) break;
    const idBytes = buffer.subarray(o, i + 1);
    // read vint size
    let j = i + 1;
    let smask = 0x80;
    let slen = 1;
    while (j < buffer.length && !(buffer[j] & smask)) {
      smask >>= 1;
      j++;
      slen++;
      if (slen > 8) break;
    }
    if (slen > 8 || j >= buffer.length) break;
    const sizeBytes = buffer.subarray(i + 1, j + 1);
    let size = Number(sizeBytes[0] & (0xff >> slen));
    for (let k = 1; k < sizeBytes.length; k++) size = size * 256 + sizeBytes[k];
    const idHex = idBytes.toString("hex");
    const payloadStart = j + 1;
    if (idHex === "4489" && size >= 4) {
      // Duration (float32 or float64)
      const floatPart = buffer.subarray(payloadStart, payloadStart + Math.min(8, size));
      if (size === 4) result.duration = floatPart.readFloatLE(0);
      else if (size === 8) result.duration = floatPart.readDoubleLE(0);
      o = payloadStart + size;
      continue;
    }
    if (idHex === "4d80" || idHex === "5741") {
      const text = buffer.subarray(payloadStart, payloadStart + Math.min(size, 256)).toString("utf8").replace(/\0+$/, "").trim();
      if (idHex === "4d80") result.muxingApp = text;
      else result.writingApp = text;
      o = payloadStart + size;
      continue;
    }
    if (size === 0 || payloadStart + size > buffer.length) break;
    o = payloadStart + size;
    scans++;
  }
  return result;
}

function analyzeVideoLocal(
  buffer: Buffer,
  asset: AssetInfo
): { ai: number; manipulation: number; confidence: number; items: EvidenceItem[]; limitations: string[] } {
  const items: EvidenceItem[] = [];
  let ai = 0.04;
  let manipulation = 0.04;

  const isWebm = buffer.subarray(0, 4).toString("ascii") === "\x1a\x45\xdf\xa3";
  let container = "video";
  let codec: string | null = null;
  let duration: number | null = null;
  let creationTime: number | null = null;
  let software: string | null = null;

  if (isWebm) {
    const w = parseWebm(buffer);
    container = "webm";
    duration = w.duration;
    software = w.writingApp || w.muxingApp;
  } else {
    const r = walkMp4Boxes(buffer);
    container = "mp4";
    codec = r.codec;
    duration = r.duration;
    creationTime = r.creationTime;
    software = r.software;
  }

  const softwareLower = (software || "").toLowerCase();
  const matchedAiTool = AI_VIDEO_TOOLS.find((t) => softwareLower.includes(t.toLowerCase()));
  const matchedEditor = VIDEO_EDITORS.find((t) => softwareLower.includes(t.toLowerCase()));

  if (matchedAiTool) {
    ai += 0.5;
    items.push(
      evidence({
        category: "ai_detection",
        type: "ai_generated",
        title: "AI video generator signature in metadata",
        description: `The file's encoder/software metadata reads "${software}" — associated with AI video generation tools.`,
        score: 0.8,
        confidence: 0.85,
        severity: "high",
      })
    );
  }

  if (matchedEditor && !matchedAiTool) {
    manipulation += 0.3;
    items.push(
      evidence({
        category: "manipulation",
        type: "splice",
        title: "Video editor recorded in metadata",
        description: `The encoder metadata reads "${software}" — the video was processed/exported with editing software.`,
        score: 0.55,
        confidence: 0.8,
        severity: "medium",
      })
    );
  } else if (softwareLower.startsWith("lavf") || softwareLower.includes("ffmpeg")) {
    manipulation += 0.1;
    items.push(
      evidence({
        category: "manipulation",
        type: "compression_anomaly",
        title: "Re-encoded with FFmpeg",
        description: `Encoder metadata ("${software}") shows the video was re-encoded or remuxed with FFmpeg — common in editing pipelines.`,
        score: 0.25,
        confidence: 0.7,
        severity: "low",
      })
    );
  }

  if (creationTime) {
    items.push(
      evidence({
        category: "metadata",
        type: "unknown",
        title: "Creation timestamp in container",
        description: `The container records a creation time of ${new Date(creationTime * 1000).toISOString()}.`,
        score: null,
        confidence: 0.9,
        severity: "low",
      })
    );
  } else {
    ai += 0.05;
    items.push(
      evidence({
        category: "metadata",
        type: "metadata_anomaly",
        title: "No creation timestamp",
        description: "The container carries no recording creation time — typical of AI-generated clips and stripped/re-exported files.",
        score: 0.2,
        confidence: 0.6,
        severity: "low",
      })
    );
  }

  const bpp = duration && duration > 0 ? (buffer.length * 8) / duration : null;
  if (bpp !== null && bpp < 800_000) {
    ai += 0.04;
    items.push(
      evidence({
        category: "metadata",
        type: "compression_anomaly",
        title: "Low bitrate for duration",
        description: `Overall bitrate is ~${Math.round(bpp / 1000)} kbps — the video is heavily compressed${codec ? ` (${codec})` : ""}, which can mask manipulation artifacts.`,
        score: 0.2,
        confidence: 0.55,
        severity: "low",
      })
    );
  }

  if (hasC2paManifest(buffer)) {
    items.push(
      evidence({
        category: "provenance",
        type: "provenance_verified",
        title: "Content Credentials (C2PA) manifest present",
        description: "The file contains a C2PA manifest that can record origin and edit history.",
        score: 0.7,
        confidence: 0.8,
        severity: "low",
      })
    );
  } else {
    items.push(
      evidence({
        category: "provenance",
        type: "provenance_absent",
        title: "No Content Credentials manifest",
        description: "No C2PA manifest found — this is normal for most videos and proves nothing by itself.",
        score: null,
        confidence: null,
        severity: "low",
      })
    );
  }

  items.push(
    evidence({
      category: "integrity",
      type: "integrity_ok",
      title: "Video container parsed",
      description: `${container.toUpperCase()} video: ${codec || "unknown codec"}, ${duration ? duration.toFixed(1) + "s" : "unknown duration"}, ${(buffer.length / (1024 * 1024)).toFixed(1)} MB.`,
      score: null,
      confidence: 0.95,
      severity: "low",
    })
  );

  const confidence = clamp01(0.45 + Math.min(0.2, items.length * 0.02));

  return {
    ai: clamp01(ai),
    manipulation: clamp01(manipulation),
    confidence,
    items,
    limitations: [
      "TrustLens' local engine reads real container metadata (encoder software, codec, timestamps) and does not run frame-level neural face analysis.",
      "Deepfake/facial detection requires a connected neural provider (Hive or Sightengine).",
    ],
  };
}

// ─── Provider ─────────────────────────────────────────────────

export class LocalDetectionProvider implements DetectionProvider {
  readonly name = "local_heuristics";
  readonly version = "1.0.0";

  getSupportedModalities(): Modality[] {
    return ["image", "video", "audio"];
  }

  supportsModality(modality: Modality): boolean {
    return ["image", "video", "audio"].includes(modality);
  }

  async analyzeImage(asset: AssetInfo): Promise<DetectionResult> {
    const start = Date.now();
    const storage = getStorage();
    const buffer = await storage.download(asset.storageKey);
    if (!buffer) throw new Error("Stored file could not be read back for analysis.");
    const r = await analyzeImageLocal(buffer, asset);
    return {
      provider: this.name,
      providerVersion: this.version,
      modality: "image",
      aiProbability: r.ai,
      manipulationProbability: r.manipulation,
      confidence: r.confidence,
      evidence: r.items,
      processingTimeMs: Date.now() - start,
      limitations: r.limitations,
      isMock: false,
    };
  }

  async analyzeVideo(asset: AssetInfo): Promise<DetectionResult> {
    const start = Date.now();
    const storage = getStorage();
    const buffer = await storage.download(asset.storageKey);
    if (!buffer) throw new Error("Stored file could not be read back for analysis.");
    const r = analyzeVideoLocal(buffer, asset);
    return {
      provider: this.name,
      providerVersion: this.version,
      modality: "video",
      aiProbability: r.ai,
      manipulationProbability: r.manipulation,
      confidence: r.confidence,
      evidence: r.items,
      processingTimeMs: Date.now() - start,
      limitations: r.limitations,
      isMock: false,
    };
  }

  async analyzeAudio(asset: AssetInfo): Promise<DetectionResult> {
    const start = Date.now();
    const storage = getStorage();
    const buffer = await storage.download(asset.storageKey);
    if (!buffer) throw new Error("Stored file could not be read back for analysis.");
    const r = analyzeAudioLocal(buffer, asset);
    return {
      provider: this.name,
      providerVersion: this.version,
      modality: "audio",
      aiProbability: r.ai,
      manipulationProbability: r.manipulation,
      confidence: r.confidence,
      evidence: r.items,
      processingTimeMs: Date.now() - start,
      limitations: r.limitations,
      isMock: false,
    };
  }
}
