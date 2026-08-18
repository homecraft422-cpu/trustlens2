/**
 * TrustLens Blog — editorial content.
 *
 * Posts live here as structured data so they are type-safe, statically
 * rendered, and feed both /blog and /blog/[slug] (plus sitemap.xml).
 * Content is intentionally original and useful: Google's quality raters
 * and AdSense reviewers reward pages that answer real questions.
 */

export type BlogBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "quote"; text: string };

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  updatedAt?: string;
  author: string;
  authorRole: string;
  tags: string[];
  readingMinutes: number;
  content: BlogBlock[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "how-to-tell-if-an-image-is-ai-generated",
    title: "How to Tell If an Image Is AI-Generated: A Practical Guide",
    description:
      "Hands and teeth look wrong. Shadows don't match. Text is garbled. Here are the visual tells, the metadata clues, and the tools you can use to check any image.",
    date: "2026-01-12",
    updatedAt: "2026-03-02",
    author: "TrustLens Research Team",
    authorRole: "Content authenticity researchers",
    tags: ["AI detection", "images", "deepfakes"],
    readingMinutes: 7,
    content: [
      {
        type: "p",
        text: "Every day, millions of AI-generated images are posted online — some harmless, some designed to mislead. Learning to spot them protects you from misinformation, scams, and manipulated news. No single clue is proof by itself, but a combination of visual tells, metadata checks, and automated analysis gets you most of the way.",
      },
      { type: "h2", text: "1. Start with the classic visual tells" },
      {
        type: "p",
        text: "AI image generators have improved dramatically, but they still struggle with a handful of things. Look at these areas first:",
      },
      {
        type: "ul",
        items: [
          "Hands and fingers — extra digits, fused fingers, or hands that bend the wrong way are the most common AI artifacts.",
          "Teeth and eyes — irregular tooth counts, odd glints, or pupils that are slightly asymmetric.",
          "Text in the image — street signs, product labels, and newspaper headlines usually come out garbled or misspelled.",
          "Background details — lamps, chair legs, and reflections that make no physical sense.",
          "Skin texture — the famous 'AI sheen': unnaturally smooth skin with waxy highlights.",
        ],
      },
      { type: "h2", text: "2. Check the metadata" },
      {
        type: "p",
        text: "Images carry hidden data called EXIF metadata. Tools like TrustLens read this automatically. Some AI generators embed their model name (for example 'Midjourney' or 'Stable Diffusion') in the metadata. Genuine camera photos record the camera model, lens, exposure settings, and often GPS coordinates. Suspicious findings include:",
      },
      {
        type: "ul",
        items: [
          "A generator name in the 'Software' or 'Comment' fields.",
          "No camera metadata at all on a photo that claims to come from a phone.",
          "An 'Edited with' field listing an AI tool like Firefly or Canva Magic.",
        ],
      },
      { type: "h2", text: "3. Reverse-search the image" },
      {
        type: "p",
        text: "Google Lens, TinEye, and Bing Visual Search let you find where an image has appeared before. A photo that appears on dozens of unrelated sites, or that matches a known template image, is more likely to be synthetic or recycled.",
      },
      { type: "h2", text: "4. Run automated AI-detection analysis" },
      {
        type: "p",
        text: "Detection engines combine dozens of statistical signals — noise patterns, compression artifacts, color statistics, and texture residuals — that human eyes miss. That's exactly what TrustLens does: upload the image and you get an AI-involvement score, a manipulation score, and a confidence level with the reasoning shown, not hidden.",
      },
      {
        type: "quote",
        text: "Important: no AI detector is 100% accurate. Treat any score as one strong signal, not a verdict of guilt.",
      },
      { type: "h2", text: "5. Look at the source" },
      {
        type: "p",
        text: "Who published the image? A verified news agency, an official account, or an anonymous page with no history? Provenance — where content came from and how it travelled — is often the strongest evidence of all.",
      },
      {
        type: "p",
        text: "If you're a journalist, researcher, or social media manager who checks images daily, upload the file to TrustLens and keep the evidence in a shareable report. Knowing what to look for, and having the receipts, is how you stay ahead of synthetic media.",
      },
    ],
  },
  {
    slug: "deepfake-detection-101",
    title: "Deepfake Detection 101: How AI Video Forensics Actually Works",
    description:
      "Face swaps, lip-sync fakes, and cloned voices are more convincing than ever. Learn what forensic signals detectors use — and why context beats panic.",
    date: "2026-01-28",
    author: "TrustLens Research Team",
    authorRole: "Content authenticity researchers",
    tags: ["deepfakes", "video", "forensics"],
    readingMinutes: 8,
    content: [
      {
        type: "p",
        text: "A video of a politician saying something they never said. A CEO announcing a fake product. A celebrity 'selling' a scam. Deepfakes have moved from novelty to everyday misinformation. Understanding how they are made — and how they are caught — is the first line of defense.",
      },
      { type: "h2", text: "How modern deepfakes are built" },
      {
        type: "p",
        text: "Most deepfakes use autoencoders or diffusion models that learn a person's face from thousands of reference images, then re-render it onto another person's body while preserving expressions and head movement. Lip-sync tools go further: they reshape the mouth area to match new audio. Voice cloning does the same for audio alone, using as little as a few seconds of a real voice.",
      },
      { type: "h2", text: "The forensic signals detectors look for" },
      {
        type: "ol",
        items: [
          "Facial blending artifacts — soft edges around the face, neck, and hairline where the swap was stitched in.",
          "Inconsistent lighting — the face lit from one angle while the rest of the scene is lit from another.",
          "Temporal flicker — subtle pixel shimmering around the face from frame to frame.",
          "Blink and micro-expression anomalies — unnatural blink rates or mismatched micro-expressions.",
          "Compression fingerprints — AI pipelines leave different error patterns than real cameras and encoders.",
          "Audio-visual sync errors — mouth movements that lag the audio by a few frames.",
        ],
      },
      { type: "h2", text: "What automated video analysis adds" },
      {
        type: "p",
        text: "A human reviewer can spot a great deepfake 20% of the time. Neural detectors trained on millions of real and fake clips catch far more because they measure statistical patterns in frequency space that eyes can't see. When you upload a video to TrustLens, the engine examines the file's encoder metadata, creation timestamps, codec settings, and frame-level statistics, and reports what it found with an honest confidence level.",
      },
      { type: "h2", text: "Why context matters most" },
      {
        type: "p",
        text: "A deepfake only harms you if you act on it. Before sharing a shocking clip:",
      },
      {
        type: "ul",
        items: [
          "Find the original source — was it posted by the person or organization involved?",
          "Check reputable fact-checkers like AFP, Reuters, or Snopes for debunks.",
          "Run the video through an analyzer and read the evidence.",
          "Wait. Viral misinformation thrives on the 30-second reaction window.",
        ],
      },
      {
        type: "quote",
        text: "Deepfake defense is a habit, not a tool: verify emotionally charged content before you forward it.",
      },
      {
        type: "p",
        text: "Bookmark this guide and the TrustLens video checker — the next viral clip you get forwarded might be the one that needs a second look.",
      },
    ],
  },
  {
    slug: "what-exif-metadata-reveals-about-photos",
    title: "What EXIF Metadata Reveals (and Hides) About Your Photos",
    description:
      "Every photo hides a data trail: camera model, timestamp, location, editing software. Here's how metadata works, why it matters for authenticity, and how to strip it.",
    date: "2026-02-10",
    author: "TrustLens Research Team",
    authorRole: "Content authenticity researchers",
    tags: ["metadata", "privacy", "forensics"],
    readingMinutes: 6,
    content: [
      {
        type: "p",
        text: "When you take a photo, your camera doesn't just save pixels — it saves a dossier about how the photo was made. That dossier is EXIF metadata, and it's a double-edged sword: a powerful tool for verifying authenticity, and a quiet privacy leak.",
      },
      { type: "h2", text: "What's actually inside EXIF?" },
      {
        type: "ul",
        items: [
          "Camera make and model (e.g., 'Apple iPhone 15 Pro Max').",
          "Exposure settings — shutter speed, aperture, ISO, focal length.",
          "The exact timestamp the photo was taken.",
          "GPS coordinates, if location services were on.",
          "Editing software history (e.g., 'Adobe Photoshop 26.0').",
          "A thumbnail of the image itself.",
        ],
      },
      { type: "h2", text: "How metadata proves (or disproves) authenticity" },
      {
        type: "p",
        text: "Forensic analysts treat metadata as corroborating evidence. A photo claiming to be 'taken this morning on a phone' but containing no camera data and a generator signature in the software field is suspicious. A photo whose timestamps are internally consistent and whose camera settings match the scene is more credible. Tools like TrustLens surface these fields automatically and tell you what they mean in plain language.",
      },
      {
        type: "p",
        text: "But metadata can also be forged. Anyone with a text editor can rewrite EXIF, and AI generators often add plausible-looking fake metadata to make their output pass casual checks. That's why serious verification combines metadata with statistical image analysis and reverse-image search — no single signal is trusted alone.",
      },
      { type: "h2", text: "The privacy side: metadata leaks your location" },
      {
        type: "p",
        text: "Posting a photo you took at home can reveal your home address if GPS data is embedded. Journalists, activists, and parents are especially at risk. Before sharing photos publicly:",
      },
      {
        type: "ol",
        items: [
          "On iPhone: Settings → Privacy → Location Services → Camera → Never (for new photos).",
          "On Android: Camera app settings → Save location off.",
          "Use a metadata stripper before publishing (many free tools exist).",
          "Screenshots of photos usually drop the metadata entirely — a quick workaround.",
        ],
      },
      { type: "h2", text: "Check any image in 30 seconds" },
      {
        type: "p",
        text: "Upload the image to TrustLens and the report will list its metadata, AI-generation signals, manipulation indicators, and provenance status with a confidence score. You don't need to be a forensics expert — the report explains each finding in plain English.",
      },
    ],
  },
  {
    slug: "fact-checking-online-claims-step-by-step",
    title: "Fact-Checking Online Claims: A Step-by-Step Guide",
    description:
      "Viral claims travel faster than verification. Here's the exact workflow we teach: find the source, trace the origin, check the experts, and know when a claim is simply unverifiable.",
    date: "2026-03-05",
    author: "TrustLens Research Team",
    authorRole: "Content authenticity researchers",
    tags: ["fact-checking", "misinformation", "guide"],
    readingMinutes: 6,
    content: [
      {
        type: "p",
        text: "A shocking headline lands in your feed. Your first instinct is to share it. Stop. The average false claim reaches more people than the truth ever does — because it's designed to be shared before it's verified. This guide is the exact workflow professional fact-checkers use, simplified for everyone.",
      },
      { type: "h2", text: "Step 1: Identify the core claim" },
      {
        type: "p",
        text: "Strip the headline down to a single checkable sentence. 'New study proves coffee cures migraines' → 'A published study found coffee cures migraines.' Vague claims ('people are saying…') can't be checked — note that immediately.",
      },
      { type: "h2", text: "Step 2: Find the original source" },
      {
        type: "ul",
        items: [
          "Who published it? A reputable news outlet, an official agency, or a random page?",
          "Does the linked study exist? Check PubMed, Google Scholar, or the journal directly.",
          "Is the source real? Look for the official domain, not a lookalike.",
        ],
      },
      { type: "h2", text: "Step 3: Cross-check with expert organizations" },
      {
        type: "p",
        text: "Professional fact-checkers do the heavy lifting. Search their databases directly: Reuters Fact Check, AFP Fact Check, Snopes, PolitiFact, India Today Fact Check, BOOM Live, and the global IFCN signatory list. If three independent, credible fact-checkers have already rated the claim, your job is 90% done.",
      },
      { type: "h2", text: "Step 4: Look for the missing context" },
      {
        type: "p",
        text: "Most viral misinformation is not entirely false — it's true-but-out-of-context. A 2023 statistic presented as 'this month.' A quote cut mid-sentence. A photo from a different country or decade. Ask: what period, place, or qualifier was removed?",
      },
      { type: "h2", text: "Step 5: Run the claim through a checker" },
      {
        type: "p",
        text: "Paste the claim into TrustLens's Fact Checker. It searches verifiable sources and returns a verdict (true, false, misleading, partially true, or unverified) with the reasoning and source links. If the claim can't be verified, the tool says so — 'unverified' is a real answer, not a failure.",
      },
      {
        type: "quote",
        text: "Unverifiable is not the same as false, and it's definitely not the same as true. Don't share what you can't source.",
      },
      { type: "h2", text: "A 60-second checklist before you share" },
      {
        type: "ul",
        items: [
          "Can I name the original source?",
          "Does a reputable fact-checker already cover it?",
          "Does the claim pass the 'too perfect' smell test?",
          "Would I stake my reputation on it being true?",
        ],
      },
      {
        type: "p",
        text: "Verification takes a minute; un-sharing takes forever. Make checking a habit and you'll be the person who breaks the chain — not the link in it.",
      },
    ],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

export function getRecentPosts(count = 3): BlogPost[] {
  return [...BLOG_POSTS]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, count);
}
