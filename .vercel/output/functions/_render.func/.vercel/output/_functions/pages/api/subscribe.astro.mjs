export { renderers } from '../../renderers.mjs';

const __vite_import_meta_env__ = {"ASSETS_PREFIX": undefined, "BASE_URL": "/", "DEV": false, "MODE": "production", "PROD": true, "SITE": "https://rajinkhan.com", "SSR": true};
const prerender = false;
let redisInstance = null;
async function getRedis() {
  if (redisInstance !== null) {
    return redisInstance;
  }
  try {
    const { Redis } = await import('@upstash/redis');
    const redisUrl = Object.assign(__vite_import_meta_env__, { KV_REST_API_URL: "https://sought-treefrog-40997.upstash.io", KV_REST_API_TOKEN: "AaAlAAIncDFhMTE3Mzk3NTE0NmI0YWRlODE2YjRlNzA0MDZjZGU2MHAxNDA5OTc", _: process.env._ }).REDIS_URL || "https://sought-treefrog-40997.upstash.io";
    const redisToken = "AaAlAAIncDFhMTE3Mzk3NTE0NmI0YWRlODE2YjRlNzA0MDZjZGU2MHAxNDA5OTc";
    if (redisUrl && (redisUrl.startsWith("rediss://") || redisUrl.startsWith("redis://"))) {
      console.warn("⚠️  Redis URL uses redis:// protocol. Upstash REST API requires https://");
      console.warn("Please use the REST API URL from Upstash dashboard (starts with https://)");
      return null;
    }
    if (!redisUrl || !redisToken) ;
    if (redisUrl.startsWith("https://")) {
      redisInstance = new Redis({
        url: redisUrl,
        token: redisToken
      });
      return redisInstance;
    }
    return null;
  } catch (error) {
    console.error("Error initializing Redis:", error);
    console.error("Error details:", error instanceof Error ? error.stack : String(error));
    return null;
  }
}
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
    const redis = await getRedis();
    if (!redis) {
      console.error("Redis not configured - check environment variables");
      return new Response(
        JSON.stringify({
          error: "Service temporarily unavailable",
          message: "Redis connection not available. Please check server configuration."
        }),
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
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    return new Response(
      JSON.stringify({
        error: "Failed to subscribe. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
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
