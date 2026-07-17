import type { APIRoute } from 'astro';

// Mark this route as dynamic (not prerendered)
export const prerender = false;

// Lazy initialization of Redis to prevent function crashes on startup
let redisInstance: any = null;

async function getRedis() {
  // Return cached instance if already initialized
  if (redisInstance !== null) {
    return redisInstance;
  }

  try {
    // Dynamic import to ensure the module is available
    const { Redis } = await import('@upstash/redis');
    
    // Initialize Redis with environment variables from Upstash
    // Vercel automatically adds these when you connect Upstash Redis
    // Prioritize KV_REST_API_URL first (Upstash REST API) over REDIS_URL (which may be redis://)
    const redisUrl = import.meta.env.KV_REST_API_URL || import.meta.env.UPSTASH_REDIS_REST_URL || import.meta.env.REDIS_URL || process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL;
    const redisToken = import.meta.env.KV_REST_API_TOKEN || import.meta.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

    // Convert rediss:// or redis:// URLs to https:// (Upstash REST API requires https)
    if (redisUrl && (redisUrl.startsWith('rediss://') || redisUrl.startsWith('redis://'))) {
      console.warn('⚠️  Redis URL uses redis:// protocol. Upstash REST API requires https://');
      console.warn('Please use the REST API URL from Upstash dashboard (starts with https://)');
      return null;
    }

    if (!redisUrl || !redisToken) {
      console.error('❌ Missing or invalid Redis environment variables');
      console.error('Required: REDIS_URL (or KV_REST_API_URL or UPSTASH_REDIS_REST_URL) - must start with https://');
      console.error('Required: KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_TOKEN)');
      return null;
    }

    if (redisUrl.startsWith('https://')) {
      redisInstance = new Redis({
        url: redisUrl,
        token: redisToken,
      });
      return redisInstance;
    }

    return null;
  } catch (error) {
    console.error('Error initializing Redis:', error);
    console.error('Error details:', error instanceof Error ? error.stack : String(error));
    return null;
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > 4096) {
      return new Response(
        JSON.stringify({ error: 'Request body is too large' }),
        { status: 413, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let body: { email?: string };
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

    const normalizedEmail = email.toLowerCase().trim();

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (normalizedEmail.length > 254 || !emailRegex.test(normalizedEmail)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Redis (lazy loading with dynamic import)
    const redis = await getRedis();
    
    // Check if Redis is configured
    if (!redis) {
      console.error('Redis not configured - check environment variables');
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
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return new Response(
      JSON.stringify({ error: 'Failed to subscribe. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
