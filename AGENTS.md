# Portfolio Maintenance Guardrails

This repository is Rajin Khan's production portfolio. Preserve its existing
dark, restrained visual identity and read `docs/CONTENT_MAINTENANCE.md` before
changing content systems or public assets.

## Tooling

- Use `pnpm`; never use `npm`.
- The supported runtime is Node.js 22.
- Do not add a dependency unless it is necessary and has been published for at
  least seven days.
- Run `pnpm run build` before considering a change complete.

## Production Data

- The Upstash Redis data is live and contains real guestbook entries and
  subscribers.
- Never run destructive Redis, Upstash, or Supabase commands without warning
  the user and obtaining explicit approval.
- Snapshot live data before any manual migration.
- Preserve sticker IDs already present in `src/data/stickers.json`. Removing or
  renaming one can make an existing guestbook placement disappear.
- Preserve the A.R.I.A. note placement ID, sticker ID, slot, and counter key
  unless the corresponding live Redis entry is intentionally migrated.
- Follow `docs/NEWSLETTER_OPERATIONS.md` before sending a Curated issue. Never
  delete delivery-ledger keys or expose newsletter environment values.

## Assets

- Files in `public/` are deployed and should be optimized for delivery.
- `source-assets/` contains editable masters, is intentionally ignored, and is
  not part of the deployed bundle.
- Do not delete a public asset until all code, Markdown, JSON, and live-data
  references to it have been checked.
- Tech logos are self-hosted in `public/assets/icons/tech/`; record new sources
  in that folder's `SOURCES.md`.

## Content Map

- Blog posts: `src/content/post/*.md`
- Project cards, ordering, and detail content: `src/content/project/*.json`
- Shared project route and renderer: `src/pages/projects/[slug].astro` and
  `src/components/projects/project-detail.astro`
- Experience timeline: `src/collections/experiences.json`
- Sticker catalog: `src/data/stickers.json`
- Uses page data: `src/pages/uses.astro`
- Homepage visual-blog preview: `src/components/rajintalksalot.astro`
- Tech stack: `src/components/tech-stack.astro`
- Curated issues: `public/newsletters/`

Follow `docs/CONTENT_MAINTENANCE.md` for each workflow, including naming,
metadata, asset optimization, and live-data caveats.

For newsletter publication and delivery commands, use
`docs/NEWSLETTER_OPERATIONS.md`.
