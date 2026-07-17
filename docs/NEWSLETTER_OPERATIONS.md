# Curated Newsletter Operations

This is the production runbook for publishing and sending a Curated issue. It
is written for both Rajin and an agent working in this repository.

The subscriber set is live production data. Do not delete, replace, export, or
manually rewrite newsletter Redis keys as part of routine publishing.

## How Delivery Works

Each issue has two deployed files:

```text
public/newsletters/curated-002.pdf
public/newsletters/curated-002-preview.jpg
```

The email does not attach the PDF. It displays the preview image and links to
the deployed PDF. This keeps the email small and avoids attachment-size and
deliverability problems.

The sender supports exactly two modes:

- `test` sends one email to `NEWSLETTER_TEST_EMAIL`.
- `send` sends the issue to the live subscriber set.

There is intentionally no preview mode. A test message is the preview.

Live delivery is protected in four ways:

1. A short Redis lock prevents two copies of the same campaign from running
   concurrently.
2. The first live run freezes a hashed recipient list for that issue, so
   subscribers who join later are not accidentally sent an old issue.
3. A permanent Redis set records the hashed recipients who successfully
   received each issue.
4. A stable Resend idempotency key protects retries at the email-provider
   boundary.

Running `send` again for the same issue skips recipients already recorded as
delivered and retries only recipients that did not complete successfully.

Issue `001` was sent before this delivery ledger existed. Do not invoke live
`send` for an already delivered historical issue. Start the protected workflow
with the next genuinely unsent issue.

## Production Environment Variables

Store real values in Vercel project settings. Never commit them, paste them
into documentation, put them in a tracked script, or include them in a support
message.

| Variable | Purpose | Secret |
| --- | --- | --- |
| `KV_REST_API_URL` | Upstash Redis HTTPS REST endpoint | No |
| `KV_REST_API_TOKEN` | Upstash Redis write token | Yes |
| `RESEND_API_KEY` | Sends email through Resend | Yes |
| `RESEND_FROM_EMAIL` | Verified sender, such as `newsletter@your-domain` | No |
| `ADMIN_SECRET` | Authorizes the private sending endpoint | Yes |
| `NEWSLETTER_UNSUBSCRIBE_SECRET` | Signs durable unsubscribe links | Yes |
| `NEWSLETTER_TEST_EMAIL` | Inbox that receives `test` sends | No |
| `SITE_URL` | Public origin, normally `https://rajinkhan.com` | No |

`NEWSLETTER_UNSUBSCRIBE_SECRET` must be at least 32 characters and must remain
stable. Rotating it invalidates unsubscribe links in previously sent issues.
A 64-character random hexadecimal value is appropriate.

Check which names exist without revealing their values:

```sh
vercel env ls
```

Add or replace a value interactively:

```sh
vercel env add KV_REST_API_URL production
vercel env add KV_REST_API_TOKEN production
vercel env add RESEND_API_KEY production
vercel env add RESEND_FROM_EMAIL production
vercel env add ADMIN_SECRET production
vercel env add NEWSLETTER_UNSUBSCRIBE_SECRET production
vercel env add NEWSLETTER_TEST_EMAIL production
vercel env add SITE_URL production
```

Run only the commands for names that are missing or intentionally being
rotated. A connected Upstash integration normally manages the two `KV_*`
values.

Generate a secret in the terminal when Vercel asks for `ADMIN_SECRET` or
`NEWSLETTER_UNSUBSCRIBE_SECRET`:

```sh
openssl rand -hex 32
```

Generate a different value for each secret, paste it only into Vercel, and do
not save it in this repository. Environment changes require a new production
deployment before serverless functions can read them.

The existing Upstash and Resend integrations may already provide most of the
other variables. `RESEND_FROM_EMAIL` must belong to a domain verified in
Resend.

## Prepare a New Issue

The examples below use issue `002`. Replace `002` consistently for later
issues.

1. Export the finished newsletter as:

   ```text
   public/newsletters/curated-002.pdf
   ```

2. Generate the first-page preview:

   ```sh
   pnpm newsletter:previews
   ```

   This requires Poppler's `pdftoppm`. It creates:

   ```text
   public/newsletters/curated-002-preview.jpg
   ```

3. Inspect the JPG. It is used by both the `/curated` archive and the email.

4. Run the production build:

   ```sh
   pnpm run build
   ```

5. Commit the PDF, preview, and any related copy changes, then push:

   ```sh
   git add public/newsletters/curated-002.pdf \
     public/newsletters/curated-002-preview.jpg
   git commit -m "Publish Curated issue 002"
   git push
   ```

6. Wait for the production deployment to finish. The sending endpoint refuses
   to proceed until both public files respond successfully.

7. Confirm the deployed files:

   ```sh
   curl -I https://rajinkhan.com/newsletters/curated-002.pdf
   curl -I https://rajinkhan.com/newsletters/curated-002-preview.jpg
   ```

Both requests should return a successful status before testing the email.

## Send a Test

Read `ADMIN_SECRET` into a temporary shell variable without placing it in shell
history:

```sh
read -s "ADMIN_SECRET?ADMIN_SECRET: "
echo
```

Send issue `002` only to `NEWSLETTER_TEST_EMAIL`:

```sh
curl --fail-with-body --silent --show-error \
  --request POST https://rajinkhan.com/api/send-newsletter \
  --header "Authorization: Bearer $ADMIN_SECRET" \
  --header "Content-Type: application/json" \
  --data '{"issueNumber":"002","mode":"test"}'
echo
```

The response should contain:

```json
{
  "success": true,
  "mode": "test",
  "issueNumber": "002"
}
```

In the test inbox, verify all of the following:

- The subject begins with `[TEST]`.
- The preview image loads.
- The PDF button opens the correct issue.
- The plain-text fallback is readable.
- The footer unsubscribe link opens a confirmation screen.
- Nothing is removed until the confirmation button is submitted.
- The email client's native unsubscribe control appears when supported.

Test sends do not touch the live delivery ledger, so they never mark a
subscriber as having received the issue.

## Send the Live Issue

Only change the mode after the test has passed:

```sh
curl --fail-with-body --silent --show-error \
  --request POST https://rajinkhan.com/api/send-newsletter \
  --header "Authorization: Bearer $ADMIN_SECRET" \
  --header "Content-Type: application/json" \
  --data '{"issueNumber":"002","mode":"send"}'
echo
```

A successful response reports:

- `total`: recipients frozen into this issue's campaign
- `sent`: newly successful deliveries
- `skipped`: recipients already recorded as delivered
- `excluded`: current subscribers who joined after this issue's recipient list
  was frozen
- `failed`: deliveries that still need attention

If `failed` is greater than zero, inspect the returned errors and run the same
`send` command again after correcting the cause. Successful recipients are
skipped; only unfinished recipients are retried.

Clear the temporary shell variable when finished:

```sh
unset ADMIN_SECRET
```

## Redis Keys Created by Sending

The workflow keeps the existing subscriber set unchanged:

```text
newsletter:subscribers
```

It adds:

```text
newsletter:delivered:002
newsletter:recipients:002
newsletter:send-lock:002
```

The recipient and delivery sets contain SHA-256 email hashes, not another
plaintext copy of the subscriber list. The lock expires automatically and is
normally removed as soon as sending finishes.

Do not delete recipient or delivery sets to "try again." Deleting them removes
the campaign snapshot or permanent duplicate-send protection and can resend an
issue to the wrong people.

## Unsubscribe Behavior

New emails contain signed unsubscribe tokens rather than plaintext email
parameters.

- Browser `GET` requests display a confirmation page and never change Redis.
- Confirmed browser forms use `POST` to unsubscribe.
- Email clients can use the standard `List-Unsubscribe` and
  `List-Unsubscribe-Post` headers for one-click removal.
- Links from older issues that contain `?email=` still open the safe
  confirmation screen; they no longer unsubscribe on page load.
- Repeating a valid unsubscribe request is harmless.

Keep `NEWSLETTER_UNSUBSCRIBE_SECRET` stable so old signed links remain usable.

## Copy, Dates, and Troubleshooting

The email structure and general introduction live in:

```text
src/pages/api/send-newsletter.ts
```

Issue `001` retains its first-issue introduction. Later issues use reusable
copy. Make any intentional copy change before the test send.

Dates are currently inferred as monthly issues beginning with December 2025.
If Curated no longer follows that sequence, replace the inferred date with
explicit issue metadata before publishing an out-of-sequence issue.

Common responses:

- `401 Unauthorized`: `ADMIN_SECRET` is wrong or missing.
- `409 files are not available`: deploy the PDF and preview first, or correct
  `SITE_URL`.
- `409 already being sent`: another live request owns the temporary lock.
- `503 environment is incomplete`: inspect the required Vercel variables and
  redeploy.
- Resend sender error: verify `RESEND_FROM_EMAIL` and its domain in Resend.

Never diagnose a problem by dumping environment variables or the subscriber
set into logs, screenshots, chat, or a committed file.
