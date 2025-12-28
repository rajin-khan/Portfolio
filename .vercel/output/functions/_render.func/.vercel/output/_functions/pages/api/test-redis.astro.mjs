export { renderers } from '../../renderers.mjs';

const prerender = false;
const GET = async () => {
  try {
    const metaEnvUrl = "https://sought-treefrog-40997.upstash.io";
    const metaEnvToken = "AaAlAAIncDFhMTE3Mzk3NTE0NmI0YWRlODE2YjRlNzA0MDZjZGU2MHAxNDA5OTc";
    const processEnvUrl = process.env.KV_REST_API_URL;
    const processEnvToken = process.env.KV_REST_API_TOKEN;
    const redisUrl = metaEnvUrl || processEnvUrl;
    const redisToken = metaEnvToken || processEnvToken;
    const diagnostics = {
      importMetaEnv: {
        hasUrl: !!metaEnvUrl,
        hasToken: !!metaEnvToken
      },
      processEnv: {
        hasUrl: !!processEnvUrl,
        hasToken: !!processEnvToken
      },
      combined: {
        hasUrl: !!redisUrl,
        hasToken: !!redisToken,
        urlPrefix: redisUrl ? redisUrl.substring(0, 30) + "..." : "NOT SET"
      },
      nodeVersion: process.version
    };
    let redisTest = { attempted: false, works: false, error: null };
    if (redisUrl && redisToken) {
      redisTest.attempted = true;
      try {
        const { Redis } = await import('@upstash/redis');
        const redis = new Redis({ url: redisUrl, token: redisToken });
        await redis.ping();
        redisTest.works = true;
      } catch (error) {
        redisTest.error = error instanceof Error ? error.message : String(error);
      }
    }
    return new Response(
      JSON.stringify({ success: true, diagnostics, redisTest }, null, 2),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
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
