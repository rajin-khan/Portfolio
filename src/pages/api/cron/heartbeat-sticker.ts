import type { APIRoute } from "astro";

export const prerender = false;

const BOARD_KEY = "sticker-board:placements";
const HEARTBEAT_LAST_RUN_KEY = "sticker-board:heartbeat:last-run-date";
const HEARTBEAT_PLACEMENT_ID = "0d7ea7bb-d430-471d-8f5c-10bbe97fe860";
const HEARTBEAT_STICKER_ID = "sticker-065";
const HEARTBEAT_SLOT_ID = 1;
const HEARTBEAT_MESSAGE_REGEX = /^heartbeats \((\d+)\), they keep the site alive!$/;

let redisInstance: any = null;

type StickerPlacement = {
  id?: string;
  stickerId?: string;
  stickerSrc?: string;
  message?: string;
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
    console.error("Error initializing heartbeat Redis:", error);
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

function findHeartbeatPlacement(placements: StickerPlacement[]) {
  return placements.find((placement) => placement?.id === HEARTBEAT_PLACEMENT_ID)
    || placements.find((placement) => (
      placement?.stickerId === HEARTBEAT_STICKER_ID &&
      placement?.slotId === HEARTBEAT_SLOT_ID
    ));
}

function nextHeartbeatMessage(message: unknown) {
  const currentMessage = typeof message === "string" ? message : "";
  const match = currentMessage.match(HEARTBEAT_MESSAGE_REGEX);
  const currentCount = match ? Number.parseInt(match[1], 10) : 1;
  const nextCount = Number.isFinite(currentCount) ? currentCount + 1 : 2;

  return {
    count: nextCount,
    message: `heartbeats (${nextCount}), they keep the site alive!`,
  };
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
      const lastRunDate = await redis.get(HEARTBEAT_LAST_RUN_KEY);
      if (lastRunDate === runDate) {
        return json({ ok: true, skipped: true, reason: "Already updated today", runDate });
      }
    }

    const placements = await readPlacements(redis) as StickerPlacement[];
    const heartbeatPlacement = findHeartbeatPlacement(placements);

    if (!heartbeatPlacement) {
      return json({ error: "Heartbeat sticker not found" }, 404);
    }

    const next = nextHeartbeatMessage(heartbeatPlacement.message);
    const nextPlacements = placements.map((placement) => {
      if (placement !== heartbeatPlacement) return placement;

      return {
        ...placement,
        message: next.message,
      };
    });

    await redis.set(BOARD_KEY, nextPlacements);
    await redis.set(HEARTBEAT_LAST_RUN_KEY, runDate);

    return json({
      ok: true,
      runDate,
      placementId: heartbeatPlacement.id,
      count: next.count,
      message: next.message,
    });
  } catch (error) {
    console.error("Error updating heartbeat sticker:", error);
    return json({ error: "Heartbeat update failed" }, 500);
  }
};
