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
    // Prioritize KV_REST_API_URL first (Upstash REST API) over REDIS_URL (which may be redis://)
    const redisUrl = import.meta.env.KV_REST_API_URL || import.meta.env.UPSTASH_REDIS_REST_URL || import.meta.env.REDIS_URL || process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL;
    const redisToken = import.meta.env.KV_REST_API_TOKEN || import.meta.env.KV_REST_API_READ_ONLY_TOKEN || import.meta.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || process.env.KV_REST_API_READ_ONLY_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

    // Convert rediss:// or redis:// URLs to https:// (Upstash REST API requires https://)
    if (redisUrl && (redisUrl.startsWith('rediss://') || redisUrl.startsWith('redis://'))) {
      console.warn('⚠️  Redis URL uses redis:// protocol. Upstash REST API requires https://');
      console.warn('Please use the REST API URL from Upstash dashboard (starts with https://)');
      return null;
    }

    if (!redisUrl || !redisToken) {
      console.error('❌ Missing or invalid Redis environment variables');
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
    return null;
  }
}

export const GET: APIRoute = async () => {
  try {
    // Initialize Redis (lazy loading with dynamic import)
    const redis = await getRedis();
    
    // Check if Redis is configured
    if (!redis) {
      return new Response(
        JSON.stringify({ 
          error: 'Redis not configured',
          hint: 'Check your environment variables: KV_REST_API_URL and KV_REST_API_TOKEN'
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

