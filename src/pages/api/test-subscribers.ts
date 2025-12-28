import type { APIRoute } from 'astro';
import { Redis } from '@upstash/redis';

// Initialize Redis with environment variables from Upstash
let redisUrl = import.meta.env.REDIS_URL || import.meta.env.KV_REST_API_URL || import.meta.env.UPSTASH_REDIS_REST_URL;
const redisToken = import.meta.env.KV_REST_API_TOKEN || import.meta.env.KV_REST_API_READ_ONLY_TOKEN || import.meta.env.UPSTASH_REDIS_REST_TOKEN;

// Convert rediss:// or redis:// URLs to https:// (Upstash REST API requires https://)
if (redisUrl && (redisUrl.startsWith('rediss://') || redisUrl.startsWith('redis://'))) {
  console.warn('⚠️  Redis URL uses redis:// protocol. Upstash REST API requires https://');
  console.warn('Please use the REST API URL from Upstash dashboard (starts with https://)');
  redisUrl = null; // Set to null to trigger error
}

const redis = redisUrl && redisToken && redisUrl.startsWith('https://')
  ? new Redis({
      url: redisUrl,
      token: redisToken,
    })
  : null;

export const GET: APIRoute = async () => {
  try {
    // Check if Redis is configured
    if (!redis) {
      return new Response(
        JSON.stringify({ 
          error: 'Redis not configured',
          hint: 'Check your environment variables: REDIS_URL and KV_REST_API_TOKEN'
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get all subscribers from the Redis set
    const subscribers = await redis.smembers('newsletter:subscribers');
    const count = await redis.scard('newsletter:subscribers');

    return new Response(
      JSON.stringify({ 
        success: true,
        count,
        subscribers: subscribers.sort() // Sort alphabetically for easier reading
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch subscribers',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

