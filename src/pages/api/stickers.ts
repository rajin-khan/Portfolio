import type { APIRoute } from "astro";
import stickers from "../../data/stickers.json";

export const prerender = false;

const BOARD_KEY = "sticker-board:placements";
const MAX_PLACEMENTS = 240;
const MESSAGE_LIMIT = 180;
const NAME_LIMIT = 32;
const STICKER_ID_REGEX = /^sticker-\d{3}$/;
const NOTE_LEET_MAP: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "@": "a",
  "$": "s",
  "!": "i",
};
const BLOCKED_NOTE_PATTERNS = [
  /\b(?:fuck|fucker|fucking|motherfucker|mf)\b/,
  /\b(?:shit|bullshit|shitty)\b/,
  /\b(?:bitch|asshole|bastard|cunt|dick|pussy|whore|slut|douchebag|wanker)\b/,
  /\b(?:nigger|nigga|niggah|niggers|niggas)\b/,
  /\b(?:fag|faggot)\b/,
  /\b(?:retard|retarded)\b/,
  /\b(?:kike|chink|spic|tranny|coon)\b/,
  /\b(?:madarchod|bhenchod|behnchod|bokachoda|choda|chodna)\b/,
];
const BLOCKED_NOTE_COMPACT_PATTERNS = [
  /f+u+c+k+/,
  /s+h+i+t+/,
  /b+i+t+c+h+/,
  /a+s+s+h+o+l+e+/,
  /c+u+n+t+/,
  /n+i+g+g+(?:a|er|ah)?/,
  /f+a+g+(?:g+o+t+)?/,
  /r+e+t+a+r+d+/,
  /m+a+d+a+r+c+h+o+d+/,
  /b+h?e+h?n+c+h+o+d+/,
  /b+o+k+a+c+h+o+d+/,
];

let redisInstance: any = null;

type StickerManifestItem = {
  id: string;
  src: string;
};

const STICKER_SOURCE_BY_ID = new Map(
  (stickers as StickerManifestItem[]).map((sticker) => [sticker.id, sticker.src]),
);

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function isKnownSticker(stickerId: string) {
  return STICKER_SOURCE_BY_ID.has(stickerId);
}

function stickerSrcFor(stickerId: string) {
  return STICKER_SOURCE_BY_ID.get(stickerId) || `/assets/images/stickers/curated/${stickerId}.jpg`;
}

function normalizeNoteForFilter(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[013457@$!]/g, (character) => NOTE_LEET_MAP[character] || character)
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function noteHasBlockedLanguage(text: string) {
  const normalized = normalizeNoteForFilter(text);
  const compact = normalized.replace(/\s+/g, "");

  return (
    BLOCKED_NOTE_PATTERNS.some((pattern) => pattern.test(normalized)) ||
    BLOCKED_NOTE_COMPACT_PATTERNS.some((pattern) => pattern.test(compact))
  );
}

function validateNote(text: string) {
  const note = text.trim();

  if (!note) return "Write a note first.";
  if (noteHasBlockedLanguage(note)) return "Please keep the note kind.";
  return "";
}

function validateName(text: string) {
  const name = text.trim();

  if (!name) return "";
  if (noteHasBlockedLanguage(name)) return "Please keep the name kind.";
  return "";
}

async function getRedis() {
  if (redisInstance !== null) return redisInstance;

  try {
    const { Redis } = await import("@upstash/redis");
    const redisUrl =
      import.meta.env.KV_REST_API_URL ||
      import.meta.env.UPSTASH_REDIS_REST_URL ||
      import.meta.env.REDIS_URL ||
      process.env.KV_REST_API_URL ||
      process.env.UPSTASH_REDIS_REST_URL ||
      process.env.REDIS_URL;
    const redisToken =
      import.meta.env.KV_REST_API_TOKEN ||
      import.meta.env.UPSTASH_REDIS_REST_TOKEN ||
      process.env.KV_REST_API_TOKEN ||
      process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!redisUrl || !redisToken || redisUrl.startsWith("redis://") || redisUrl.startsWith("rediss://")) {
      return null;
    }

    if (!redisUrl.startsWith("https://")) return null;

    redisInstance = new Redis({
      url: redisUrl,
      token: redisToken,
    });

    return redisInstance;
  } catch (error) {
    console.error("Error initializing sticker Redis:", error);
    return null;
  }
}

function normalizePlacements(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .filter((placement: any) => {
      return (
        placement &&
        STICKER_ID_REGEX.test(placement.stickerId) &&
        isKnownSticker(placement.stickerId) &&
        Number.isInteger(placement.slotId) &&
        placement.slotId >= 0 &&
        placement.slotId < MAX_PLACEMENTS
      );
    })
    .slice(0, MAX_PLACEMENTS)
    .map((placement: any) => ({
      id: String(placement.id || crypto.randomUUID()),
      stickerId: placement.stickerId,
      stickerSrc: stickerSrcFor(placement.stickerId),
      message: String(placement.message || "").slice(0, MESSAGE_LIMIT),
      authorName: String(placement.authorName || "").slice(0, NAME_LIMIT),
      slotId: placement.slotId,
      createdAt: String(placement.createdAt || new Date().toISOString()),
    }));
}

async function readPlacements(redis: any) {
  const value = await redis.get(BOARD_KEY);
  if (typeof value === "string") {
    try {
      return normalizePlacements(JSON.parse(value));
    } catch {
      return [];
    }
  }

  return normalizePlacements(value);
}

export const GET: APIRoute = async () => {
  const redis = await getRedis();
  if (!redis) {
    return json({ placements: [], storage: "unavailable" });
  }

  try {
    const placements = await readPlacements(redis);
    return json({ placements });
  } catch (error) {
    console.error("Error reading sticker placements:", error);
    return json({ placements: [], storage: "unavailable" }, 503);
  }
};

export const POST: APIRoute = async ({ request }) => {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 4096) {
    return json({ error: "Request body is too large" }, 413);
  }

  const redis = await getRedis();
  if (!redis) {
    return json({ error: "Sticker board storage unavailable" }, 503);
  }

  let body: { stickerId?: string; message?: string; authorName?: string; slotId?: number };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON in request body" }, 400);
  }

  const stickerId = typeof body.stickerId === "string" ? body.stickerId : "";
  const message = typeof body.message === "string" ? body.message.trim().slice(0, MESSAGE_LIMIT) : "";
  const authorName = typeof body.authorName === "string" ? body.authorName.trim().slice(0, NAME_LIMIT) : "";
  const requestedSlotId = Number.isInteger(body.slotId) ? body.slotId : undefined;

  if (!STICKER_ID_REGEX.test(stickerId) || !isKnownSticker(stickerId)) {
    return json({ error: "Invalid sticker" }, 400);
  }

  const noteError = validateNote(message);
  if (noteError) {
    return json({ error: noteError }, 400);
  }

  const nameError = validateName(authorName);
  if (nameError) {
    return json({ error: nameError }, 400);
  }

  try {
    const placements = await readPlacements(redis);
    const occupiedSlots = new Set(placements.map((placement) => placement.slotId));
    const usedStickers = new Set(placements.map((placement) => placement.stickerId));
    const slotId =
      requestedSlotId !== undefined &&
      requestedSlotId >= 0 &&
      requestedSlotId < MAX_PLACEMENTS &&
      !occupiedSlots.has(requestedSlotId)
        ? requestedSlotId
        : Array.from({ length: MAX_PLACEMENTS }, (_, index) => index).find((index) => !occupiedSlots.has(index));

    if (slotId === undefined) {
      return json({ error: "The sticker board is full", placements }, 409);
    }

    if (usedStickers.has(stickerId)) {
      return json({ error: "That sticker has already been placed", placements }, 409);
    }

    const placement = {
      id: crypto.randomUUID(),
      stickerId,
      stickerSrc: stickerSrcFor(stickerId),
      message,
      authorName,
      slotId,
      createdAt: new Date().toISOString(),
    };
    const nextPlacements = [...placements, placement];

    await redis.set(BOARD_KEY, nextPlacements);

    return json({ success: true, placement, placements: nextPlacements });
  } catch (error) {
    console.error("Error saving sticker placement:", error);
    return json({ error: "Sticker board storage unavailable", storage: "unavailable" }, 503);
  }
};
