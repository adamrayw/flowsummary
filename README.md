# flowsummary

This is a [Next.js](https://nextjs.org) project bootstrapped with [v0](https://v0.app).

## Built with v0

This repository is linked to a [v0](https://v0.app) project. You can continue developing by visiting the link below -- start new chats to make changes, and v0 will push commits directly to this repo. Every merge to `main` will automatically deploy.

[Continue working on v0 →](https://v0.app/chat/projects/prj_2xuaFMOQW6Gx38PqWw2t1J3ttPEV)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## RayTech Account SSO

FlowSummary uses RayTech Account for sign in/register, following the same product SSO flow as FlowNote.

Set these environment variables when running locally or deploying:

```bash
NEXT_PUBLIC_AUTH_URL=https://auth.raytech.cloud
RAYTECH_AUTH_URL=https://auth.raytech.cloud
RAYTECH_SESSION_COOKIE_NAME=raytech_session
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL="postgresql://postgres:root@localhost:5432/flowsummary"
OPENROUTER_API_KEY="your-openrouter-api-key-here"
OPENROUTER_MODEL="meta-llama/llama-3.1-8b-instruct:free"
OPENROUTER_FALLBACK_MODEL="openrouter/free"
```

Auth behavior:

- `/signin` redirects to RayTech Account login.
- `/signup` redirects to RayTech Account registration.
- `/dashboard/*` requires a RayTech session cookie.
- `GET /api/auth/me` returns the authenticated RayTech user.

## Dashboard Data and AI

FlowSummary stores generated summaries in PostgreSQL with Prisma and generates reports through OpenRouter.

```bash
npm run db:up
npm run prisma:generate
npm run prisma:migrate
```

The dashboard uses:

- `GET /api/summaries` for sidebar history.
- `POST /api/summaries` to generate and save a new AI summary.
- `GET /api/summaries/:id` to reopen a saved summary.
- `DELETE /api/summaries/:id` to remove a saved summary.

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.
