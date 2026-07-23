import type { APIRoute } from "astro";
import { getAriaNote } from "../../../data/aria-notes";

export const prerender = false;

const BOARD_KEY = "sticker-board:placements";
const ARIA_COUNT_KEY = "sticker-board:aria-note:count";
const ARIA_LAST_RUN_KEY = "sticker-board:heartbeat:last-run-date";
const ARIA_PLACEMENT_ID = "0d7ea7bb-d430-471d-8f5c-10bbe97fe860";
const ARIA_STICKER_ID = "sticker-065";
const ARIA_SLOT_ID = 1;
const LEGACY_HEARTBEAT_MESSAGE_REGEX = /^heartbeats \((\d+)\), they keep the site alive!$/;
const ARIA_AUTHOR_NAME = "A.R.I.A.";

let redisInstance: any = null;

type StickerPlacement = {
  id?: string;
  stickerId?: string;
  stickerSrc?: string;
  message?: string;
  authorName?: string;
  slotId?: number;
  createdAt?: string;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

function isAuthorized(request: Request) {
  const cronSecret = import.meta.env.CRON_SECRET || process.env.CRON_SECRET;
  if (!cronSecret) return false;

  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
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

    if (!redisUrl || !redisToken || !redisUrl.startsWith("https://")) {
      return null;
    }

    redisInstance = new Redis({
      url: redisUrl,
      token: redisToken,
    });

    return redisInstance;
  } catch (error) {
    console.error("Error initializing A.R.I.A. note Redis:", error);
    return null;
  }
}

async function readPlacements(redis: any) {
  const value = await redis.get(BOARD_KEY);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return Array.isArray(value) ? value : [];
}

function findAriaPlacement(placements: StickerPlacement[]) {
  return placements.find((placement) => placement?.id === ARIA_PLACEMENT_ID)
    || placements.find((placement) => (
      placement?.stickerId === ARIA_STICKER_ID &&
      placement?.slotId === ARIA_SLOT_ID
    ));
}

function parseCount(value: unknown) {
  const count = typeof value === "number"
    ? value
    : Number.parseInt(typeof value === "string" ? value : "", 10);

  return Number.isInteger(count) && count >= 1 ? count : null;
}

function countFromMessage(message: unknown) {
  const currentMessage = typeof message === "string" ? message : "";
  const legacyMatch = currentMessage.match(LEGACY_HEARTBEAT_MESSAGE_REGEX);
  if (legacyMatch) return parseCount(legacyMatch[1]);

  return parseCount(currentMessage.match(/\d+/)?.[0]);
}

export const GET: APIRoute = async ({ request, url }) => {
  if (!isAuthorized(request)) {
    return json({ error: "Unauthorized" }, 401);
  }

  const redis = await getRedis();
  if (!redis) {
    return json({ error: "Sticker board storage unavailable" }, 503);
  }

  const runDate = todayUtc();
  const force = url.searchParams.get("force") === "1";

  try {
    if (!force) {
      const lastRunDate = await redis.get(ARIA_LAST_RUN_KEY);
      if (lastRunDate === runDate) {
        return json({ ok: true, skipped: true, reason: "Already updated today", runDate });
      }
    }

    const placements = await readPlacements(redis) as StickerPlacement[];
    const ariaPlacement = findAriaPlacement(placements);

    if (!ariaPlacement) {
      return json({ error: "A.R.I.A. sticker not found" }, 404);
    }

    const storedCount = parseCount(await redis.get(ARIA_COUNT_KEY));
    const currentCount = storedCount ?? countFromMessage(ariaPlacement.message) ?? 1;
    const nextCount = currentCount + 1;
    const nextMessage = getAriaNote(nextCount);
    const updatedAt = new Date().toISOString();
    const nextPlacements = placements.map((placement) => {
      if (placement !== ariaPlacement) return placement;

      return {
        ...placement,
        message: nextMessage,
        authorName: ARIA_AUTHOR_NAME,
        createdAt: updatedAt,
      };
    });

    await redis.set(BOARD_KEY, nextPlacements);
    await redis.set(ARIA_COUNT_KEY, nextCount);
    await redis.set(ARIA_LAST_RUN_KEY, runDate);

    return json({
      ok: true,
      runDate,
      placementId: ariaPlacement.id,
      count: nextCount,
      authorName: ARIA_AUTHOR_NAME,
      message: nextMessage,
    });
  } catch (error) {
    console.error("Error updating A.R.I.A. sticker:", error);
    return json({ error: "A.R.I.A. note update failed" }, 500);
  }
};
