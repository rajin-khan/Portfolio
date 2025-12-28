import { Redis } from '@upstash/redis';
export { renderers } from '../../renderers.mjs';

const prerender = false;
let redisUrl = "https://sought-treefrog-40997.upstash.io";
const redisToken = "AaAlAAIncDFhMTE3Mzk3NTE0NmI0YWRlODE2YjRlNzA0MDZjZGU2MHAxNDA5OTc";
if (redisUrl && (redisUrl.startsWith("rediss://") || redisUrl.startsWith("redis://"))) {
  console.warn("⚠️  Redis URL uses redis:// protocol. Upstash REST API requires https://");
  console.warn("Please use the REST API URL from Upstash dashboard (starts with https://)");
  redisUrl = null;
}
if (!redisUrl || !redisToken) {
  console.error("❌ Missing or invalid Redis environment variables");
}
const redis = redisUrl && redisToken && redisUrl.startsWith("https://") ? new Redis({
  url: redisUrl,
  token: redisToken
}) : null;
const GET = async ({ url }) => {
  try {
    if (!redis) {
      return new Response(
        JSON.stringify({ error: "Service temporarily unavailable: Redis not configured" }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }
    const email = url.searchParams.get("email");
    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ error: "Email parameter is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const normalizedEmail = email.toLowerCase().trim();
    const removed = await redis.srem("newsletter:subscribers", normalizedEmail);
    return new Response(
      JSON.stringify({
        success: true,
        message: "Successfully unsubscribed",
        wasSubscribed: removed > 0
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error unsubscribing email:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to unsubscribe",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
