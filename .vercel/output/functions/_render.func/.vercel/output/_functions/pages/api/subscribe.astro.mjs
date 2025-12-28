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
  console.error("Required: REDIS_URL (or KV_REST_API_URL or UPSTASH_REDIS_REST_URL) - must start with https://");
  console.error("Required: KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_TOKEN)");
}
const redis = redisUrl && redisToken && redisUrl.startsWith("https://") ? new Redis({
  url: redisUrl,
  token: redisToken
}) : null;
const POST = async ({ request }) => {
  try {
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const { email } = body || {};
    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
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
    if (!redis) {
      console.error("Redis not configured");
      return new Response(
        JSON.stringify({ error: "Service temporarily unavailable" }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }
    await redis.sadd("newsletter:subscribers", normalizedEmail);
    return new Response(
      JSON.stringify({ success: true, message: "Successfully subscribed" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error subscribing email:", error);
    return new Response(
      JSON.stringify({ error: "Failed to subscribe. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
