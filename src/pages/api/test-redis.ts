import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async () => {
    try {
        // Check environment variables from both sources
        const metaEnvUrl = import.meta.env.KV_REST_API_URL;
        const metaEnvToken = import.meta.env.KV_REST_API_TOKEN;
        const processEnvUrl = process.env.KV_REST_API_URL;
        const processEnvToken = process.env.KV_REST_API_TOKEN;

        const redisUrl = metaEnvUrl || processEnvUrl;
        const redisToken = metaEnvToken || processEnvToken;

        const diagnostics = {
            importMetaEnv: {
                hasUrl: !!metaEnvUrl,
                hasToken: !!metaEnvToken,
            },
            processEnv: {
                hasUrl: !!processEnvUrl,
                hasToken: !!processEnvToken,
            },
            combined: {
                hasUrl: !!redisUrl,
                hasToken: !!redisToken,
                urlPrefix: redisUrl ? redisUrl.substring(0, 30) + '...' : 'NOT SET',
            },
            nodeVersion: process.version,
        };

        // Only test Redis if we have credentials
        let redisTest = { attempted: false, works: false, error: null as string | null };

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
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        return new Response(
            JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            }, null, 2),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
