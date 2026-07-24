# Portfolio Content Maintenance

This is the shared handbook for Rajin and any coding agent updating the
portfolio. It describes the current implementation, not a proposed CMS.

## Before Any Update

1. Use Node.js 22 and `pnpm`.
2. Check `git status --short` before editing. The worktree may contain unrelated
   user changes.
3. Keep editable masters out of the deployed `public/` folder. Put optimized
   delivery files in `public/`.
4. Never rename or remove a public path until every reference has been checked.
5. Treat Upstash Redis as live production data. Snapshot it before a migration,
   and never run a destructive command without explicit approval.
6. Finish with `pnpm run build`, inspect `git diff --check`, and stage required
   new assets as well as code.

## Content Map

| Content | Primary source |
| --- | --- |
| Blog posts | `src/content/post/*.md` |
| Blog index cards | Generated from the post collection |
| Project cards, ordering, and detail content | `src/content/project/*.json` |
| Shared project route and renderer | `src/pages/projects/[slug].astro` and `src/components/projects/project-detail.astro` |
| Experience timeline | `src/collections/experiences.json` |
| Guestbook sticker catalog | `src/data/stickers.json` |
| Guestbook doodles | `public/assets/images/stickers/doodles/` and `src/components/sticker-board.jsx` |
| Homepage rajintalksalot visual | `src/components/rajintalksalot.astro` |
| Uses page | `src/pages/uses.astro` |
| About-page photos | `src/components/bento-image-switcher.astro` |
| Tech-stack marquee | `src/components/tech-stack.astro` |
| Curated newsletter issues | `public/newsletters/` |
| Navigation, footer, and global metadata | `src/layouts/main.astro` |
| Homepage identity and structured data | `src/pages/index.astro` |

## Write a Blog Post

Create `src/content/post/my-post-slug.md`. The filename becomes the public URL:
`/post/my-post-slug/`.

Use this frontmatter:

```yaml
---
title: "A Clear, Human Title"
description: "One sentence used on the blog index and in search previews."
date: 2026-07-17
updated: 2026-07-20 # optional; add only after a meaningful revision
tags:
  - Culture
  - Technology
image: "/assets/images/posts/my-post/cover.jpg"
---
```

Only `title`, `description`, and `date` are required. `updated`, `tags`, and
`image` are optional. The post collection validates these fields at build time.
The layout automatically supplies canonical metadata, Open Graph metadata,
BlogPosting schema, breadcrumbs, the share button, comments, and typography.

Write normal Markdown below the frontmatter:

```md
Opening paragraph.

## Section heading

Body copy with [a useful link](https://example.com).

![Descriptive alt text](/assets/images/posts/my-post/detail.jpg)
```

Keep one folder per image-heavy post under `public/assets/images/posts/`.
Prefer JPG for photographs, WebP/AVIF when there is a meaningful size win, PNG
only for transparency, and SVG for simple authored vectors. Give every image
descriptive alt text. The build makes the first Markdown image eager and later
images lazy, so the first image should be the intended lead visual.

For video, place an optimized MP4/WebM in `public/assets/videos/` and use:

```html
<video
  data-autoplay
  preload="none"
  playsinline
  muted
  loop
  poster="/assets/images/posts/my-post/video-poster.jpg"
>
  <source src="/assets/videos/my-post-clip.mp4" type="video/mp4" />
</video>
```

`data-autoplay` lets the post layout play only when the video is near the
viewport, pause it offscreen or in a hidden tab, and expose controls for reduced
motion. Always provide a poster and avoid shipping camera-original video.

The blog index renders every post statically, shows the newest five initially,
and reveals older posts in batches of five through the `Load older posts`
button. Change `POSTS_PER_BATCH` in `src/pages/posts.astro` if the batch size
needs to change. Use build-time pagination only when the archive becomes large
enough for rendering every card to make the page materially heavy.

## Add or Update a Project

Every project has one validated data entry in `src/content/project/`. That entry
is the source of truth for its card, ordering, metadata, links, and optional
detail page. Do not create another `.astro` file for a project and do not edit
`src/pages/projects/[slug].astro` for project-specific content.

The important shared fields are:

```json
{
  "slug": "project-name",
  "order": 13,
  "detail": true,
  "name": "Project Name",
  "cardName": "Project Name",
  "description": "The fuller description used on the detail page and in metadata.",
  "cardDescription": "A concise one-line card description.",
  "note": "A short handwritten aside shared by every card and the carousel.",
  "image": {
    "src": "/assets/images/projects/project-name.jpg",
    "width": 1600,
    "height": 900
  },
  "href": "/projects/project-name",
  "tags": ["AI", "Web"],
  "accents": {
    "primary": "#22c55e",
    "secondary": "#f8fafc",
    "screen": "#07140c"
  }
}
```

`order` controls the catalogue. The homepage shows the six lowest values and
`/projects/` shows every entry. `note` supplies the restrained handwritten copy,
while `accents.screen` frames previews and `accents.primary` and
`accents.secondary` carry the project palette into the carousel and detail
page. Tags remain visually neutral and are controlled by the shared
`src/components/project.astro` card. The filename, `slug`, and internal `href`
should use the same lowercase kebab-case value.

For an internal detail page, keep `detail` set to `true` and also provide:

- `heroActions`, normally a live-project link and a GitHub link.
- `sections`, rendered in array order.

Available section types are:

| Type | Required content |
| --- | --- |
| `prose` | `title`, one or more `paragraphs`, and optional `actions` |
| `features` | `title` and `items` with `name`, `description`, and optional `icon` |
| `use-cases` | `title` and `items` with `name`, `description`, and optional `emoji` |
| `cards` | A neutral general-purpose card grid, currently used for tech-stack items |
| `roadmap` | `title` and items with `name` and `status` |
| `team` | `title` and items with `name`, `institution`, and GitHub URL |

Paragraph strings may contain small trusted inline tags such as `<strong>` and
`<em>`. This content is rendered as HTML, so never paste visitor-controlled or
untrusted HTML into a project entry.

To add an internal project:

1. Add the optimized preview image to `public/assets/images/projects/`.
2. Copy the closest entry in `src/content/project/` and rename it to the new
   slug.
3. Replace every field, section, URL, image dimension, and accent.
4. Assign a unique `order`.
5. Run `pnpm run build`; the schema rejects malformed sections and the dynamic
   route generates `/projects/<slug>/`.
6. Verify the card and detail page on desktop and mobile.

For an external-only project, set `detail` to `false`, use the full external URL
for `href`, and omit `heroActions` and `sections`. It still needs `note` and
`accents` because the shared cards and carousel use them, but it will not
generate an internal route.

## Update the Homepage rajintalksalot Visual

There are two separate preview systems:

1. The project-card thumbnail is controlled by
   `src/content/project/rajintalksalot.json`, normally
   `public/assets/images/projects/rajintalksalot.jpg`.
2. The layered homepage visual is hardcoded in
   `src/components/rajintalksalot.astro`.

The current homepage bundle lives at:

```text
public/assets/rajintalksalot/vincent-van-gogh/media/
```

The component currently uses stems `8a`, `8b`, and `8c`, with AVIF at 1080px
and WebP at 720px, 1080px, and 1600px. A bundle's `meta.json` and `content.md`
are archival context; the portfolio does not read them dynamically.

To replace the layered visual:

1. Keep the source images in `source-assets/rajintalksalot/<slug>/images/`.
2. Export matching square delivery variants into
   `public/assets/rajintalksalot/<slug>/media/`.
3. Preserve the stem naming across every format and size.
4. Edit `basePath` and the `images.front`, `images.near`, and `images.far`
   `stem` values in `src/components/rajintalksalot.astro`.
5. Verify all three layers load and the hover/tilt effect remains framed at
   desktop and mobile sizes.

Do not place full-resolution masters in `public/`. Mirror the current bundle's
dimensions and formats with an image tool such as `cwebp`/FFmpeg, then compare
visual quality and file size before replacing the existing delivery assets.

## Add Guestbook Stickers

The sticker image files live in:

```text
public/assets/images/stickers/curated/
```

The catalog lives in `src/data/stickers.json`. IDs use three digits, such as
`sticker-108`, because the API validates that format. Add the next unused ID:

```json
{
  "id": "sticker-108",
  "src": "/assets/images/stickers/curated/sticker-108.jpg",
  "width": 1200,
  "height": 800,
  "aspectRatio": 1.5
}
```

Use the image's real pixel dimensions and calculate `width / height` for
`aspectRatio`. Keep assets reasonably compressed. Never reuse, rename, or
remove an ID that may already exist in Redis: the API validates placements
against the catalog, so an old board entry can disappear if its catalog ID is
gone.

The board uses the Redis key `sticker-board:placements`. Each placement stores
`id`, `stickerId`, `message`, optional `authorName`, `slotId`, and `createdAt`.
The limits are 180 message characters and 32 name characters. The visual board
has 240 slots, while the one-placement-per-sticker rule also limits capacity to
the catalog size.

The note-back doodles are listed near the top of
`src/components/sticker-board.jsx` and stored in
`public/assets/images/stickers/doodles/`. Their assignment is deterministic for
each entry. Replacing an existing file changes that doodle everywhere; adding a
fourth requires adding its path to the component array.

The daily cron in `src/pages/api/cron/heartbeat-sticker.ts` updates one exact
placement as A.R.I.A. It rotates through a fixed set of notes, stores the
sequence in `sticker-board:aria-note:count`, and refreshes the placement date.
The first run can recover the count from the legacy heartbeat message, so no
manual Redis migration is required. Do not change the placement ID, sticker ID,
or slot unless the live Redis entry is migrated at the same time.

The 365-message rotation lives in `src/data/aria-notes.ts`. Keep exactly one
`{count}` placeholder in each note and keep every rendered message within the
guestbook's 180-character limit. The visible count continues upward forever;
only the message selection loops after 365 entries.

## Update Experience

Edit `src/collections/experiences.json`. Entries render in file order.

The current legacy field names are counterintuitive:

- `role` is the large organization or school name.
- `company` is the position, program, or qualification shown beneath it.
- `dates`, `logo`, and `description` are rendered as written.

Use an optimized local icon path and concise text. When the current employer
changes, also update the Person schema's `worksFor` field in
`src/pages/index.astro`.

## Update Uses

The Uses page data is the `usesData` category record near the top of
`src/pages/uses.astro`. Category labels and descriptions live in the adjacent
`categoryMeta` record. Each item supports:

- `name`: rendered item title.
- `icon`: required transparent PNG filename from
  `public/assets/icons/uses/marks/`. A generic utility SVG is allowed when an
  item has no identifiable brand.
- `iconKind`: optional `mark`, `wide`, or `character` sizing hint. Omit it for
  ordinary square-ish logomarks, use `wide` for horizontal wordmarks, and use
  `character` for transparent character art.
- `details`: optional subtitle or specification line.
- `description`: the item note shown in the directory.
- `coords: { x, y }`: optional setup-photo percentages. Supplying coordinates
  adds both an image hotspot and the laptop locate button in the list.
- `highlight: true`: draws the two-line doodled circle around the title and
  details.
- `highlightNote`: optional handwritten text above the circle. It defaults to
  `current fave`.
- `highlightSide`: optional `left` or `right` override for the note. Without an
  override, side and circle tilt are chosen deterministically from the category
  and item name, so they vary without moving between builds.

When adding an item, use a recognizable official brand, app, or character mark.
Export a tightly cropped PNG with a transparent background, save it in
`public/assets/icons/uses/marks/`, record its exact source in the parent
folder's `SOURCES.md`, and reference the filename through `icon`. Preserve the
mark's natural silhouette, colors, orientation, and aspect ratio. Do not place
it on a square tile, add a CSS badge shell, rotate it, or bake in a white
background. Prefer an official horizontal wordmark only when the standalone
logomark is unavailable or unrecognizable at this size. The layout's invisible
logo slot handles alignment without adding visible chrome.

Highlights are data-driven and work on every Uses item. Add `highlight: true`
and `highlightNote` to circle the item's title plus optional `details` line.
Use `highlightSide` only when the deterministic left/right placement conflicts
with nearby content. Keep highlights selective so the annotation remains
meaningful rather than becoming the default state.

After changing the setup photo, remeasure every `coords` callout against the
displayed image and test keyboard focus as well as pointer hover. Highlighted
items need a desktop and mobile check because handwritten notes intentionally
sit above their row content.

## Update About Photos

The rotating profile photos are referenced in
`src/components/bento-image-switcher.astro`. Add optimized local images, update
the component list/styles, and confirm that crop and transition behavior still
work at both aspect ratios.

The globe textures in `public/assets/images/globe/` are optimized runtime
assets. Keep the editable originals outside `public/`. The Three.js scene is
intentionally isolated to the About page and pauses when hidden or offscreen.

## Update the Tech Stack

Edit the ordered array in `src/components/tech-stack.astro`. Icons are
self-hosted in `public/assets/icons/tech/`, so the marquee has no runtime logo
CDN dependency.

1. Download an official or otherwise verified brand asset.
2. Minimize it without changing the logo.
3. Save it in `public/assets/icons/tech/`.
4. Record the source in `public/assets/icons/tech/SOURCES.md`.
5. Add the item to the component array. Include the extension when it is not
   the default SVG.
6. Check it on the dark background. Use the component's monochrome adaptation
   only when appropriate; preserve requested brand colors.

Each tech item also supports `adaptive: true` for suitable monochrome logos,
`highlight: true` for the doodled circle, and `highlightNote` for custom
handwritten text. A highlighted item without custom text uses `current fave`.

The marquee duplicates items in the DOM to loop seamlessly, but browsers reuse
the same local files. The current icon directory is small enough that this is
preferable to fragile third-party image URLs.

## Publish Curated

Follow `docs/NEWSLETTER_OPERATIONS.md`. It contains the complete production
workflow for:

- naming and placing the PDF and preview image
- configuring Vercel without committing secrets
- sending to the configured test inbox
- sending the live campaign
- safely retrying failures without duplicate deliveries
- preserving scanner-safe unsubscribe behavior

The archive discovers matching PDFs at build time. The displayed issue date is
currently calculated as a monthly sequence starting with issue 001 in December
2025. If publishing stops being monthly, replace that inference with explicit
issue metadata before adding an out-of-sequence issue.

Subscriber data is live. Do not use removed diagnostic APIs, delete newsletter
delivery keys, or manually rewrite the subscriber set.

## Update Identity, Navigation, or Status

- Hero text, current coding status, profile schema, and homepage section order:
  `src/pages/index.astro`
- Header, footer, social links, default metadata, and JSON-LD:
  `src/layouts/main.astro`
- Resume: `public/ARKResume2026.pdf` and its link in the homepage
- Robots and sitemap discovery: `public/robots.txt` and `astro.config.mjs`
- Manifest metadata: `public/site.webmanifest`

The site is intentionally dark-only. Do not add light-mode conditionals or
remote fonts without a specific design decision.

The four `scripts/set-*.sh` status helpers use paths relative to the scripts
directory and automatically run `git pull`, commit, and push. Prefer editing the
`StatusIndicator` prop directly. Do not run those helpers in a dirty worktree;
consolidate or remove them later if that one-command publishing behavior is no
longer wanted.

## Final Verification and Git Checklist

Run:

```sh
pnpm run build
git diff --check
git status --short
```

Then verify the affected page locally. For a content deployment, check:

- New public files return successfully and have correct casing.
- Images and video are compressed, correctly cropped, and have alt/poster text.
- Internal links use the intended trailing-slash behavior.
- Structured data contains current names, dates, URLs, and images.
- Mobile has no horizontal overflow.
- Keyboard focus, reduced motion, and modal dismissal still work.
- Every required untracked delivery asset is staged. Preview the operation with
  `git add -n -A -- . ':(exclude)source-assets'`, then remove `-n` only after the
  list looks right.

Do not blindly stage `source-assets/`; decide whether those large masters belong
in Git, an external archive, Git LFS, or `.gitignore`.
