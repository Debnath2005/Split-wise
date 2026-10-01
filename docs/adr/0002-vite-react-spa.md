# 0002. React + Vite single-page app instead of Next.js

- **Status:** Accepted
- **Date:** 2026-10-01

## Context
The app sits behind a login, is used mostly on phones, and needs no SEO. All trusted logic lives in Supabase ([0003](0003-supabase-backend.md)), so we don't need our own server runtime.

## Decision
- Build a client-only SPA with **Vite + React 18 + TypeScript in strict mode**.
- Use React Router v6, TanStack Query v5 (the only cache for server data), React Hook Form + Zod, and Tailwind CSS.
- Deploy as static files on Vercel or Netlify, rewriting every route to `index.html`.

## Consequences
- ➕ Simple, cheap static hosting and a fast dev loop.
- ➕ No server code to secure or scale.
- ➖ No server-side rendering. First load is a JS bundle, so bundle size must be watched to meet the mobile Lighthouse targets.
- ➖ Nothing trusted can run in the browser. That logic has to go into Postgres ([0005](0005-writes-via-security-definer-rpcs.md)).

## Alternatives considered
- **Next.js App Router:** server components and API routes add complexity that no feature needs.
- **Create React App:** deprecated and slow.
- **SPA + PWA now:** postponed. It can be added later without changing anything else.
