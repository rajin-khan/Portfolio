export { renderers } from '../../renderers.mjs';

const __vite_import_meta_env__ = {"ASSETS_PREFIX": undefined, "BASE_URL": "/", "DEV": false, "MODE": "production", "PROD": true, "SITE": "https://rajinkhan.com", "SSR": true};
const prerender = false;
const GET = async () => {
  try {
    const redisUrl = Object.assign(__vite_import_meta_env__, { KV_REST_API_URL: "https://sought-treefrog-40997.upstash.io", KV_REST_API_TOKEN: "AaAlAAIncDFhMTE3Mzk3NTE0NmI0YWRlODE2YjRlNzA0MDZjZGU2MHAxNDA5OTc" }).REDIS_URL || "https://sought-treefrog-40997.upstash.io";
    const redisToken = "AaAlAAIncDFhMTE3Mzk3NTE0NmI0YWRlODE2YjRlNzA0MDZjZGU2MHAxNDA5OTc";
    const envVars = {
      hasRedisUrl: !!redisUrl,
      hasRedisToken: !!redisToken,
      redisUrlPrefix: redisUrl ? redisUrl.substring(0, 20) + "..." : "missing",
      availableEnvKeys: Object.keys(Object.assign(__vite_import_meta_env__, { KV_REST_API_URL: "https://sought-treefrog-40997.upstash.io", KV_REST_API_TOKEN: "AaAlAAIncDFhMTE3Mzk3NTE0NmI0YWRlODE2YjRlNzA0MDZjZGU2MHAxNDA5OTc" })).filter(
        (k) => k.includes("REDIS") || k.includes("KV") || k.includes("UPSTASH")
      )
    };
    let redisImportWorks = false;
    let redisError = null;
    try {
      await import('@upstash/redis');
      redisImportWorks = true;
    } catch (error) {
      redisError = error instanceof Error ? error.message : String(error);
    }
    return new Response(
      JSON.stringify({
        success: true,
        environment: envVars,
        redisImport: {
          works: redisImportWorks,
          error: redisError
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : void 0
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
