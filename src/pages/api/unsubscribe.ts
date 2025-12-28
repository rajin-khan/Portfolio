import type { APIRoute } from 'astro';

// Mark this route as dynamic (not prerendered)
export const prerender = false;

// Lazy initialization of Redis to prevent function crashes on startup
let redisInstance: any = null;

async function getRedis() {
    if (redisInstance !== null) {
        return redisInstance;
    }

    try {
        const { Redis } = await import('@upstash/redis');

        const redisUrl = import.meta.env.REDIS_URL || import.meta.env.KV_REST_API_URL || import.meta.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL || process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
        const redisToken = import.meta.env.KV_REST_API_TOKEN || import.meta.env.KV_REST_API_READ_ONLY_TOKEN || import.meta.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || process.env.KV_REST_API_READ_ONLY_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

        if (!redisUrl || !redisToken) {
            console.error('❌ Missing Redis environment variables');
            return null;
        }

        if (redisUrl.startsWith('rediss://') || redisUrl.startsWith('redis://')) {
            console.error('❌ Redis URL must use https:// protocol');
            return null;
        }

        if (redisUrl.startsWith('https://')) {
            redisInstance = new Redis({ url: redisUrl, token: redisToken });
            return redisInstance;
        }

        return null;
    } catch (error) {
        console.error('Error initializing Redis:', error);
        return null;
    }
}

export const GET: APIRoute = async ({ url }) => {
    try {
        const email = url.searchParams.get('email');

        if (!email || typeof email !== 'string') {
            return new Response(
                JSON.stringify({ error: 'Email parameter is required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return new Response(
                JSON.stringify({ error: 'Invalid email format' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const redis = await getRedis();

        if (!redis) {
            return new Response(
                JSON.stringify({ error: 'Service temporarily unavailable: Redis not configured' }),
                { status: 503, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const normalizedEmail = email.toLowerCase().trim();
        const removed = await redis.srem('newsletter:subscribers', normalizedEmail);

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Successfully unsubscribed',
                wasSubscribed: removed > 0,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        console.error('Error unsubscribing email:', error);
        return new Response(
            JSON.stringify({
                error: 'Failed to unsubscribe',
                details: error instanceof Error ? error.message : 'Unknown error',
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
