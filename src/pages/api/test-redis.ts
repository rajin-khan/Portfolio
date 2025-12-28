import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async () => {
    try {
        // Check environment variables from both import.meta.env and process.env
        const metaEnvUrl = import.meta.env.REDIS_URL || import.meta.env.KV_REST_API_URL || import.meta.env.UPSTASH_REDIS_REST_URL;
        const metaEnvToken = import.meta.env.KV_REST_API_TOKEN || import.meta.env.KV_REST_API_READ_ONLY_TOKEN || import.meta.env.UPSTASH_REDIS_REST_TOKEN;

        const processEnvUrl = process.env.REDIS_URL || process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
        const processEnvToken = process.env.KV_REST_API_TOKEN || process.env.KV_REST_API_READ_ONLY_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

        const redisUrl = metaEnvUrl || processEnvUrl;
        const redisToken = metaEnvToken || processEnvToken;

        const envVars = {
            importMetaEnv: {
                hasUrl: !!metaEnvUrl,
                hasToken: !!metaEnvToken,
                urlPrefix: metaEnvUrl ? metaEnvUrl.substring(0, 25) + '...' : 'NOT SET',
                availableKeys: Object.keys(import.meta.env).filter(k =>
                    k.includes('REDIS') || k.includes('KV') || k.includes('UPSTASH')
                ),
            },
            processEnv: {
                hasUrl: !!processEnvUrl,
                hasToken: !!processEnvToken,
                urlPrefix: processEnvUrl ? processEnvUrl.substring(0, 25) + '...' : 'NOT SET',
                availableKeys: Object.keys(process.env).filter(k =>
                    k.includes('REDIS') || k.includes('KV') || k.includes('UPSTASH')
                ),
            },
            combined: {
                hasUrl: !!redisUrl,
                hasToken: !!redisToken,
            }
        };

        // Try to import and use Redis
        let redisTest = { works: false, error: null as string | null, pingResult: null as string | null };

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
        } else {
            redisTest.error = 'Missing URL or Token';
        }

        return new Response(
            JSON.stringify({
                success: true,
                environment: envVars,
                redisConnection: redisTest,
                nodeVersion: process.version,
            }, null, 2),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        return new Response(
            JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
            }, null, 2),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
