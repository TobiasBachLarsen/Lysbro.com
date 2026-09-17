# Lysbro

A self-hosted, GDPR-compliant video conferencing platform built for the European market. Lysbro lets users host encrypted video meetings without sending data outside the EU/EEA.

**Status:** built and used as the final exam project (top grade); the hosted instance at lysbro.com is currently switched off to save server costs, while the code is still maintained. Run it locally as described below.

---

## Overview

Lysbro is a full-stack SaaS application built on top of a self-hosted [Jitsi Meet](https://jitsi.org) instance. The frontend handles authentication, meeting management, contacts, real-time messaging, and subscription management. Video calls run end-to-end encrypted via WebRTC/SRTP on infrastructure located entirely in Germany (Hetzner, Falkenstein).

All infrastructure is EU-based. No data is transferred to third countries.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, custom CSS design system |
| Auth & Database | Supabase (PostgreSQL + Row Level Security) |
| Real-time | Supabase Realtime (WebSocket subscriptions) |
| Video | Self-hosted Jitsi Meet (Prosody + Jicofo + JVB) |
| Video Auth | JWT tokens via Prosody `mod_auth_token` |
| Deployment | Railway (EU West — Amsterdam) |
| Video Server | Hetzner VPS (Falkenstein, DE) |

---

## Architecture

```
Browser
  │
  ├── Next.js (Railway EU West)
  │     ├── App Router pages
  │     ├── /api/jitsi-token  ← signs JWT for meeting access
  │     └── Supabase client   ← auth, profiles, meetings, messages
  │
  └── Jitsi Meet (Hetzner DE)
        ├── Prosody (XMPP + JWT auth)
        ├── Jicofo  (conference coordinator)
        └── JVB     (WebRTC media — SFU)
```

Meeting access is controlled by a signed JWT. The `/api/jitsi-token` route verifies the Supabase session, then issues a short-lived JWT that Prosody validates before admitting the user to a room. This means the video server never trusts the client directly.

---

## Features

- Email/password auth with email confirmation (Supabase Auth)
- Meeting scheduling with calendar view and participant invitations
- Real-time notifications (contact requests, meeting invites, org invites)
- Direct messaging with live updates via Supabase Realtime
- Organisation workspace with announcement board and group chat
- Avatar upload via Supabase Storage
- Subscription tiers (Gratis / Professionel / Erhverv) with ad display for free users
- Admin panel for organisation management
- Global error boundary and custom 404 page
- Fully responsive — mobile sidebar drawer included

---

## Project Structure

```
app/
├── api/jitsi-token/     # JWT signing endpoint
├── components/          # AppLayout, Sidebar, LysbroLogo
├── lib/                 # Supabase client, useUser hook, utils, data
├── types/               # Shared TypeScript interfaces (DB rows, plan meta, etc.)
├── (pages)/
│   ├── dashboard/       # Usage overview
│   ├── meetings/        # List, detail, new meeting, live room
│   ├── messages/        # Direct messaging
│   ├── contacts/        # Contact management + requests
│   ├── calendar/        # Monthly calendar view
│   ├── history/         # Past meetings
│   ├── subscription/    # Plan management
│   ├── admin/           # Organisation workspace
│   └── profile/         # User profile + avatar
├── globals.css          # Design tokens, utility classes, animations
└── error.tsx            # Global error boundary
```

---

## Local Development

**Prerequisites:** Node.js 20+, pnpm

```bash
pnpm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
JITSI_SECRET=your_jitsi_jwt_secret
```

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deployment

The frontend deploys to Railway (EU West region) via the manual "Deploy Frontend to Railway" workflow, using `railway.json`. Automatic deploys are switched off while the hosted instance is down; every push and pull request still runs lint and a production build in CI.

The Jitsi server runs as a standalone VPS on Hetzner in Falkenstein, Germany, configured with:
- Prosody with `mod_auth_token` for JWT-based room access
- TURN server for WebRTC NAT traversal
- TLS via Let's Encrypt

---

## Security & Privacy

- All user data stored in Supabase (EU region)
- Video traffic stays on Hetzner DE — no US routing
- Row Level Security enforces data isolation per user at the database level
- JWTs for meeting access are short-lived and signed server-side
- No third-party analytics or tracking
- GDPR-compliant: data processor agreement available on Erhverv plan

---

## Kendte begrænsninger og næste skridt

Nogle ting er bevidst skåret fra i denne omgang, ikke overset:

- **Betaling er en attrap.** Plan-skift og fakturering er ikke bygget endnu — abonnementssiden er informativ, og planændringer håndteres manuelt.
- **Ingen automatiske tests endnu.** Der er ikke opsat en test-runner. Næste skridt for et projekt i denne størrelse.
- **Deltager-panel på mødesiden kommer senere.** Møde-invitationer og RSVP fungerer allerede via beskeder, men er ikke vist på selve mødesiden endnu.
