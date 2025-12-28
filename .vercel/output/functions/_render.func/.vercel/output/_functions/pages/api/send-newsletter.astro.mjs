export { renderers } from '../../renderers.mjs';

const prerender = false;
let redisInstance = null;
let resendInstance = null;
async function getRedis() {
  if (redisInstance !== null) return redisInstance;
  try {
    const { Redis } = await import('@upstash/redis');
    const redisUrl = "https://sought-treefrog-40997.upstash.io";
    const redisToken = "AaAlAAIncDFhMTE3Mzk3NTE0NmI0YWRlODE2YjRlNzA0MDZjZGU2MHAxNDA5OTc";
    if (!redisUrl || !redisToken || !redisUrl.startsWith("https://")) {
      console.error("❌ Missing or invalid Redis environment variables");
      return null;
    }
    redisInstance = new Redis({ url: redisUrl, token: redisToken });
    return redisInstance;
  } catch (error) {
    console.error("Error initializing Redis:", error);
    return null;
  }
}
async function getResend() {
  if (resendInstance !== null) return resendInstance;
  try {
    const { Resend } = await import('resend');
    const apiKey = "re_HaqQ81SH_HAxm1t43jq1bpgteoMLhydDo";
    if (!apiKey) ;
    resendInstance = new Resend(apiKey);
    return resendInstance;
  } catch (error) {
    console.error("Error initializing Resend:", error);
    return null;
  }
}
function getDateFromIssueNumber(issueNumber) {
  const startDate = new Date(2025, 11, 1);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthOffset = issueNumber - 1;
  const targetDate = new Date(startDate);
  targetDate.setMonth(startDate.getMonth() + monthOffset);
  const month = months[targetDate.getMonth()];
  const yearShort = targetDate.getFullYear().toString().slice(-2);
  return `${month} ${yearShort}'`;
}
function generateEmailHTML(issueNumber, date, email, siteUrl) {
  const pdfUrl = `${siteUrl}/newsletters/curated-${issueNumber.padStart(3, "0")}.pdf`;
  const unsubscribeUrl = `${siteUrl}/api/unsubscribe?email=${encodeURIComponent(email)}`;
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>curated. #${issueNumber}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a; color: #ffffff;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0a0a0a;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #0a0a0a; border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 24px; overflow: hidden;">
          <tr>
            <td style="background-color: #0a0a0a; padding: 3px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0a0a0a; border-radius: 21px; overflow: hidden;">
                <tr>
                  <td style="padding: 40px 40px 30px; text-align: center;">
                    <div style="font-style: italic; font-size: 32px; font-weight: 500; color: #ffffff; margin: 0 0 8px;">curated.</div>
                    <div style="font-size: 13px; color: rgba(255, 255, 255, 0.6); margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">Issue #${issueNumber} • ${date}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 40px 40px; text-align: center;">
                    <p style="margin: 0 0 20px; font-size: 13px; line-height: 1.6; color: rgba(255, 255, 255, 0.9);">Hey there,</p>
                    <p style="margin: 0 0 30px; font-size: 13px; line-height: 1.6; color: rgba(255, 255, 255, 0.9);">
                      A new issue of curated is here! Hope you enjoy the read.
                    </p>
                    <table role="presentation" style="width: 100%; margin: 30px 0;">
                      <tr>
                        <td style="text-align: center;">
                          <a href="${pdfUrl}" style="display: inline-block; padding: 12px 28px; background: #ffffff; color: #0a0a0a; text-decoration: none; border-radius: 12px; font-weight: 400; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;">view newsletter</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 30px 40px; background-color: #0a0a0a; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                    <p style="margin: 0 0 12px; font-size: 11px; color: rgba(255, 255, 255, 0.4); text-align: center;">
                      You're receiving this because you subscribed to curated.
                    </p>
                    <p style="margin: 0; font-size: 11px; text-align: center;">
                      <a href="${unsubscribeUrl}" style="color: rgba(255, 255, 255, 0.5); text-decoration: underline;">unsubscribe</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <table role="presentation" style="width: 100%; margin-top: 20px;">
          <tr>
            <td style="text-align: center; padding: 20px;">
              <p style="margin: 0; font-size: 11px; color: rgba(255, 255, 255, 0.3);">
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
const POST = async ({ request }) => {
  try {
    const authHeader = request.headers.get("Authorization");
    const adminSecret = authHeader?.replace("Bearer ", "") || authHeader;
    const expectedSecret = "003e20e138a3d37f38c025082323f0a565341123afa6bb1de30426d03384d786";
    if (!adminSecret || adminSecret !== expectedSecret) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const { issueNumber } = body || {};
    if (!issueNumber || typeof issueNumber !== "string") {
      return new Response(
        JSON.stringify({ error: "Issue number is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const issueNum = parseInt(issueNumber, 10);
    if (isNaN(issueNum) || issueNum < 1) {
      return new Response(
        JSON.stringify({ error: "Invalid issue number format" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const redis = await getRedis();
    if (!redis) {
      return new Response(
        JSON.stringify({ error: "Service temporarily unavailable: Redis not configured" }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }
    const resend = await getResend();
    if (!resend) {
      return new Response(
        JSON.stringify({ error: "Service temporarily unavailable: Resend not configured" }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }
    const siteUrl = "http://localhost:4321";
    const subscribers = await redis.smembers("newsletter:subscribers");
    const total = subscribers.length;
    if (total === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, failed: 0, total: 0, message: "No subscribers found" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    const date = getDateFromIssueNumber(issueNum);
    const formattedIssueNumber = issueNumber.padStart(3, "0");
    let sent = 0;
    let failed = 0;
    const errors = [];
    for (const email of subscribers) {
      try {
        const emailHTML = generateEmailHTML(formattedIssueNumber, date, email, siteUrl);
        const fromEmail = "newsletter@rajinkhan.com";
        const result = await resend.emails.send({
          from: `Curated. <${fromEmail}>`,
          to: email,
          subject: `Issue ${formattedIssueNumber}`,
          html: emailHTML
        });
        if (result.error) {
          failed++;
          errors.push(`${email}: ${result.error.message || JSON.stringify(result.error)}`);
        } else {
          sent++;
        }
      } catch (error) {
        failed++;
        errors.push(`${email}: ${error instanceof Error ? error.message : "Unknown error"}`);
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
        ...errors.length > 0 && { errors: errors.slice(0, 10) }
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending newsletter:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to send newsletter",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
