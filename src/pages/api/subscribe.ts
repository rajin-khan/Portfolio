import type { APIRoute } from 'astro';
import { Redis } from '@upstash/redis';

// Mark this route as dynamic (not prerendered)
export const prerender = false;

// Initialize Redis with environment variables from Upstash
// Vercel automatically adds these when you connect Upstash Redis
let redisUrl = import.meta.env.REDIS_URL || import.meta.env.KV_REST_API_URL || import.meta.env.UPSTASH_REDIS_REST_URL;
const redisToken = import.meta.env.KV_REST_API_TOKEN || import.meta.env.KV_REST_API_READ_ONLY_TOKEN || import.meta.env.UPSTASH_REDIS_REST_TOKEN;

// Convert rediss:// or redis:// URLs to https:// (Upstash REST API requires https)
if (redisUrl && (redisUrl.startsWith('rediss://') || redisUrl.startsWith('redis://'))) {
  console.warn('⚠️  Redis URL uses redis:// protocol. Upstash REST API requires https://');
  console.warn('Please use the REST API URL from Upstash dashboard (starts with https://)');
  redisUrl = null; // Set to null to trigger error
}

if (!redisUrl || !redisToken) {
  console.error('❌ Missing or invalid Redis environment variables');
  console.error('Required: REDIS_URL (or KV_REST_API_URL or UPSTASH_REDIS_REST_URL) - must start with https://');
  console.error('Required: KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_TOKEN)');
}

const redis = redisUrl && redisToken && redisUrl.startsWith('https://')
  ? new Redis({
      url: redisUrl,
      token: redisToken,
    })
  : null;

export const POST: APIRoute = async ({ request }) => {
  try {
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { email } = body || {};

    // Validate email
    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
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

    // Normalize email (lowercase)
    const normalizedEmail = email.toLowerCase().trim();

    // Check if Redis is configured
    if (!redis) {
      console.error('Redis not configured');
      return new Response(
        JSON.stringify({ error: 'Service temporarily unavailable' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Add to Redis set (automatically handles duplicates)
    await redis.sadd('newsletter:subscribers', normalizedEmail);

    return new Response(
      JSON.stringify({ success: true, message: 'Successfully subscribed' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error subscribing email:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to subscribe. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

