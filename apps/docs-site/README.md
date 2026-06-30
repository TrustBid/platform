# TrustBid Docs

External documentation for TrustBid — built with Next.js 14 (App Router) and Tailwind CSS.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — redirects to `/docs/overview`.

## Editing Content

Every doc page stores its text in **constants at the top of the file** (e.g. `app/docs/overview/page.tsx`). Change copy there without touching JSX structure.

## Pages

- Overview — What is TrustBid
- How It Works — 6-step payment flow
- Architecture — Tech stack and system layers
- User Roles — Permissions and responsibilities
- Features — Platform capabilities
- Stellar Building Blocks — SDP, Privy, off-ramp
- Security — Key custody, privacy, isolation
- UI Glossary — Terminology guidelines

## Structure

- `app/docs/` — documentation pages
- `components/docs/` — reusable doc components
- `lib/navigation.ts` — sidebar nav + search index
