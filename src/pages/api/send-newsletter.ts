import type { APIRoute } from 'astro';
import { Redis } from '@upstash/redis';
import { Resend } from 'resend';

// Mark this route as dynamic (not prerendered)
export const prerender = false;

// Initialize Redis with environment variables from Upstash
let redisUrl = import.meta.env.REDIS_URL || import.meta.env.KV_REST_API_URL || import.meta.env.UPSTASH_REDIS_REST_URL;
const redisToken = import.meta.env.KV_REST_API_TOKEN || import.meta.env.KV_REST_API_READ_ONLY_TOKEN || import.meta.env.UPSTASH_REDIS_REST_TOKEN;

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

// Initialize Resend
const resendApiKey = import.meta.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Function to calculate date from issue number
// curated-001 = Dec 25', curated-002 = Jan 26', etc.
function getDateFromIssueNumber(issueNumber: number): string {
  const startDate = new Date(2025, 11, 1); // December 2025 (month is 0-indexed)
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const monthOffset = issueNumber - 1;
  const targetDate = new Date(startDate);
  targetDate.setMonth(startDate.getMonth() + monthOffset);

  const month = months[targetDate.getMonth()];
  const year = targetDate.getFullYear();
  const yearShort = year.toString().slice(-2);

  return `${month} ${yearShort}'`;
}

// Generate email HTML template
function generateEmailHTML(issueNumber: string, date: string, email: string, siteUrl: string): string {
  const pdfUrl = `${siteUrl}/newsletters/curated-${issueNumber.padStart(3, '0')}.pdf`;
  const unsubscribeUrl = `${siteUrl}/api/unsubscribe?email=${encodeURIComponent(email)}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>curated. #${issueNumber}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap" rel="stylesheet">
  <link href="https://fonts.cdnfonts.com/css/satoshi" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; font-family: 'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a; color: #ffffff;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0a0a0a;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #0a0a0a; border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 24px; overflow: hidden;">
          <!-- Inner container with background -->
          <tr>
            <td style="background-color: #0a0a0a; padding: 3px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0a0a0a; border-radius: 21px; overflow: hidden;">
                <!-- Header with curated. branding -->
                <tr>
                  <td style="padding: 40px 40px 30px; text-align: center;">
                    <div style="font-family: 'Instrument Serif', serif; font-style: italic; font-size: 32px; font-weight: 500; color: #ffffff; margin: 0 0 8px; letter-spacing: -0.5px;">curated.</div>
                    <div style="font-family: 'Satoshi', sans-serif; font-size: 13px; color: rgba(255, 255, 255, 0.6); margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">Issue #${issueNumber} • ${date}</div>
                  </td>
                </tr>
                
                <!-- Main Content -->
                <tr>
                  <td style="padding: 0 40px 40px; text-align: center;">
                    <p style="margin: 0 0 20px; font-size: 13px; line-height: 1.6; color: rgba(255, 255, 255, 0.9); font-family: 'Satoshi', sans-serif;">Hey there,</p>
                    
                    <p style="margin: 0 0 30px; font-size: 13px; line-height: 1.6; color: rgba(255, 255, 255, 0.9); font-family: 'Satoshi', sans-serif;">
                      Welcome to the first issue of curated. I won't be sending you new issues every month, just whenever I find cool enough stuff to share.
                      Hope you enjoy the read (and if you don't, you can unsubscribe anytime).
                    </p>
                    
                    <!-- CTA Button -->
                    <table role="presentation" style="width: 100%; margin: 30px 0;">
                      <tr>
                        <td style="text-align: center;">
                          <a href="${pdfUrl}" style="display: inline-block; padding: 12px 28px; background: #ffffff; border: none; color: #0a0a0a; text-decoration: none; border-radius: 12px; font-weight: 400; font-size: 10px; font-family: 'Satoshi', sans-serif; text-transform: uppercase; letter-spacing: 0.5px; transition: all 0.2s ease;">view newsletter</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; background-color: #0a0a0a; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                    <p style="margin: 0 0 12px; font-size: 11px; color: rgba(255, 255, 255, 0.4); text-align: center; font-family: 'Satoshi', sans-serif;">
                      You're receiving this because you subscribed to curated, and have really good taste.
                    </p>
                    <p style="margin: 0; font-size: 11px; text-align: center; font-family: 'Satoshi', sans-serif;">
                      <a href="${unsubscribeUrl}" style="color: rgba(255, 255, 255, 0.5); text-decoration: underline;">unsubscribe</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
        <!-- Bottom Spacing -->
        <table role="presentation" style="width: 100%; margin-top: 20px;">
          <tr>
            <td style="text-align: center; padding: 20px;">
              <p style="margin: 0; font-size: 11px; color: rgba(255, 255, 255, 0.3); font-family: 'Satoshi', sans-serif;">
                by <a href="${siteUrl}" style="color: rgba(255, 255, 255, 0.5); text-decoration: none;">rajin khan</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // Validate ADMIN_SECRET
    const authHeader = request.headers.get('Authorization');
    const adminSecret = authHeader?.replace('Bearer ', '') || authHeader;
    
    if (!adminSecret || adminSecret !== import.meta.env.ADMIN_SECRET) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    let body: { issueNumber?: string };
    try {
      body = await request.json();
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { issueNumber } = body || {};

    // Validate issue number
    if (!issueNumber || typeof issueNumber !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Issue number is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate issue number format (should be numeric)
    const issueNum = parseInt(issueNumber, 10);
    if (isNaN(issueNum) || issueNum < 1) {
      return new Response(
        JSON.stringify({ error: 'Invalid issue number format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if Redis is configured
    if (!redis) {
      console.error('Redis not configured');
      return new Response(
        JSON.stringify({ error: 'Service temporarily unavailable: Redis not configured' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if Resend is configured
    if (!resend) {
      console.error('Resend not configured');
      return new Response(
        JSON.stringify({ error: 'Service temporarily unavailable: Resend not configured' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get site URL
    const siteUrl = import.meta.env.SITE_URL || 'https://rajinkhan.com';

    // Get all subscribers
    const subscribers = await redis.smembers('newsletter:subscribers');
    const total = subscribers.length;

    if (total === 0) {
      return new Response(
        JSON.stringify({ 
          success: true,
          sent: 0,
          failed: 0,
          total: 0,
          message: 'No subscribers found'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Calculate date for this issue
    const date = getDateFromIssueNumber(issueNum);
    const formattedIssueNumber = issueNumber.padStart(3, '0');

    // Send emails
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const email of subscribers) {
      try {
        const emailHTML = generateEmailHTML(formattedIssueNumber, date, email, siteUrl);
        
        // Get from email - use environment variable or default to newsletter@rajinkhan.com
        // Since domain is verified, any email at rajinkhan.com works
        const fromEmail = import.meta.env.RESEND_FROM_EMAIL || '[email protected]';
        
        const result = await resend.emails.send({
          from: `Curated. <${fromEmail}>`,
          to: email,
          subject: `Issue ${formattedIssueNumber}`,
          html: emailHTML,
        });

        // Log Resend response for debugging
        console.log(`Resend response for ${email}:`, JSON.stringify(result, null, 2));

        // Check if Resend returned an error
        if (result.error) {
          failed++;
          const errorMessage = result.error.message || JSON.stringify(result.error);
          errors.push(`${email}: ${errorMessage}`);
          console.error(`Resend error for ${email}:`, result.error);
        } else {
          sent++;
          console.log(`Successfully sent email to ${email}, ID: ${result.data?.id || 'unknown'}`);
        }
      } catch (error) {
        failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${email}: ${errorMessage}`);
        console.error(`Failed to send email to ${email}:`, error);
        // Log full error details
        if (error instanceof Error) {
          console.error('Error stack:', error.stack);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent,
        failed,
        total,
        issueNumber: formattedIssueNumber,
        date,
        ...(errors.length > 0 && { errors: errors.slice(0, 10) }), // Limit errors in response
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending newsletter:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send newsletter',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

