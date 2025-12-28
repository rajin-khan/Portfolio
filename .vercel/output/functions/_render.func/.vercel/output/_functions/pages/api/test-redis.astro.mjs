export { renderers } from '../../renderers.mjs';

const __vite_import_meta_env__ = {"ASSETS_PREFIX": undefined, "BASE_URL": "/", "DEV": false, "MODE": "production", "PROD": true, "SITE": "https://rajinkhan.com", "SSR": true};
const prerender = false;
const GET = async () => {
  try {
    const metaEnvUrl = Object.assign(__vite_import_meta_env__, { KV_REST_API_URL: "https://sought-treefrog-40997.upstash.io", KV_REST_API_TOKEN: "AaAlAAIncDFhMTE3Mzk3NTE0NmI0YWRlODE2YjRlNzA0MDZjZGU2MHAxNDA5OTc" }).REDIS_URL || "https://sought-treefrog-40997.upstash.io";
    const metaEnvToken = "AaAlAAIncDFhMTE3Mzk3NTE0NmI0YWRlODE2YjRlNzA0MDZjZGU2MHAxNDA5OTc";
    const processEnvUrl = process.env.REDIS_URL || process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const processEnvToken = process.env.KV_REST_API_TOKEN || process.env.KV_REST_API_READ_ONLY_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    const redisUrl = metaEnvUrl || processEnvUrl;
    const redisToken = metaEnvToken || processEnvToken;
    const envVars = {
      importMetaEnv: {
        hasUrl: !!metaEnvUrl,
        hasToken: !!metaEnvToken,
        urlPrefix: metaEnvUrl ? metaEnvUrl.substring(0, 25) + "..." : "NOT SET",
        availableKeys: Object.keys(Object.assign(__vite_import_meta_env__, { KV_REST_API_URL: "https://sought-treefrog-40997.upstash.io", KV_REST_API_TOKEN: "AaAlAAIncDFhMTE3Mzk3NTE0NmI0YWRlODE2YjRlNzA0MDZjZGU2MHAxNDA5OTc" })).filter(
          (k) => k.includes("REDIS") || k.includes("KV") || k.includes("UPSTASH")
        )
      },
      processEnv: {
        hasUrl: !!processEnvUrl,
        hasToken: !!processEnvToken,
        urlPrefix: processEnvUrl ? processEnvUrl.substring(0, 25) + "..." : "NOT SET",
        availableKeys: Object.keys(process.env).filter(
          (k) => k.includes("REDIS") || k.includes("KV") || k.includes("UPSTASH")
        )
      },
      combined: {
        hasUrl: !!redisUrl,
        hasToken: !!redisToken
      }
    };
    let redisTest = { works: false, error: null, pingResult: null };
    if (redisUrl && redisToken) {
      try {
        const { Redis } = await import('@upstash/redis');
        const redis = new Redis({ url: redisUrl, token: redisToken });
        const result = await redis.ping();
        redisTest.works = true;
        redisTest.pingResult = result;
      } catch (error) {
        redisTest.error = error instanceof Error ? error.message : String(error);
      }
    }
    return new Response(
      JSON.stringify({
        success: true,
        environment: envVars,
        redisConnection: redisTest,
        nodeVersion: process.version
      }, null, 2),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : void 0
      }, null, 2),
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
