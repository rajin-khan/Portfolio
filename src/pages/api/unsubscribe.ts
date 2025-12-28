import type { APIRoute } from 'astro';
import { Redis } from '@upstash/redis';

// Mark this route as dynamic (not prerendered)
export const prerender = false;

// Initialize Redis with environment variables from Upstash
let redisUrl = import.meta.env.REDIS_URL || import.meta.env.KV_REST_API_URL || import.meta.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL || process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const redisToken = import.meta.env.KV_REST_API_TOKEN || import.meta.env.KV_REST_API_READ_ONLY_TOKEN || import.meta.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || process.env.KV_REST_API_READ_ONLY_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

// Convert rediss:// or redis:// URLs to https:// (Upstash REST API requires https://)
if (redisUrl && (redisUrl.startsWith('rediss://') || redisUrl.startsWith('redis://'))) {
    console.warn('⚠️  Redis URL uses redis:// protocol. Upstash REST API requires https://');
    console.warn('Please use the REST API URL from Upstash dashboard (starts with https://)');
    redisUrl = null;
}

if (!redisUrl || !redisToken) {
    console.error('❌ Missing or invalid Redis environment variables');
}

const redis = redisUrl && redisToken && redisUrl.startsWith('https://')
    ? new Redis({
        url: redisUrl,
        token: redisToken,
    })
    : null;

export const GET: APIRoute = async ({ url }) => {
    try {
        // Check if Redis is configured
        if (!redis) {
            return new Response(
                JSON.stringify({ error: 'Service temporarily unavailable: Redis not configured' }),
                { status: 503, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Get email from query parameter
        const email = url.searchParams.get('email');

        // Validate email
        if (!email || typeof email !== 'string') {
            return new Response(
                JSON.stringify({ error: 'Email parameter is required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Basic email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return new Response(
                JSON.stringify({ error: 'Invalid email format' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Normalize email (lowercase, trimmed)
        const normalizedEmail = email.toLowerCase().trim();

        // Remove from Redis set
        const removed = await redis.srem('newsletter:subscribers', normalizedEmail);

        // Return success regardless of whether email was in the list
        // This prevents email enumeration attacks
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

