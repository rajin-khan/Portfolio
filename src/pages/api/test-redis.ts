import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    // Check environment variables
    const redisUrl = import.meta.env.REDIS_URL || import.meta.env.KV_REST_API_URL || import.meta.env.UPSTASH_REDIS_REST_URL;
    const redisToken = import.meta.env.KV_REST_API_TOKEN || import.meta.env.KV_REST_API_READ_ONLY_TOKEN || import.meta.env.UPSTASH_REDIS_REST_TOKEN;
    
    const envVars = {
      hasRedisUrl: !!redisUrl,
      hasRedisToken: !!redisToken,
      redisUrlPrefix: redisUrl ? redisUrl.substring(0, 20) + '...' : 'missing',
      availableEnvKeys: Object.keys(import.meta.env).filter(k => 
        k.includes('REDIS') || k.includes('KV') || k.includes('UPSTASH')
      ),
    };

    // Try to import Redis
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
          error: redisError,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

