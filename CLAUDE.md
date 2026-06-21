# CLAUDE.md — RavenLog / BillGen

Project context for Claude Code. Update this file whenever a significant decision is made.

---

## Project Identity

- **Product name:** RavenLog
- **Domain:** ravenlog.in
- **Internal codebase name:** BillGen (repo name, stays as-is)
- **Razorpay / KYC registration name:** "Document Tools" or "RecordKit" — neutral, never "RavenLog"
- **What it is:** Document generation tool for Indian salaried employees — expense reimbursement submissions, tax proof filing, personal record keeping
- **Who it's for:** 50M+ salaried Indian workforce that submits expense claims and tax proofs 2x per year (Jan–Mar peak, Oct–Dec secondary)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite + React Router 7 |
| Styling | Custom CSS — cyberpunk/Blade Runner aesthetic. Rajdhani + Share Tech Mono fonts |
| State | Zustand with localStorage persistence |
| Animations | Motion (Framer Motion) |
| PDF Export | html2pdf.js |
| Image Export | html2canvas |
| Backend | Vercel serverless functions (`api/` folder) |
| Database | Google Sheets via service account |
| Payments | Razorpay recurring subscriptions |
| Hosting | Vercel |

---

## Design System

**Aesthetic:** Cyberpunk / Blade Runner / Retro-futurist. Dark backgrounds always — never light mode.

| Token | Value | Usage |
|-------|-------|-------|
| Accent primary | `#06b6d4` (cyan) | Primary actions, active states, glow |
| Accent secondary | `#ec4899` (pink) | Paywall, danger, secondary glow |
| Accent purple | `#a855f7` | Coming soon, settings |
| Accent success | `#22c55e` | Success states |
| Background primary | `#050505` | Page background |
| Background secondary | `#0d0d12` | Cards, panels |
| Border | `#2d303e` | Default borders |
| Text primary | `#e2e8f0` | Headings |
| Text muted | `#64748b` | Labels, hints |

**UI wordmark:** RΛVEN_LOG  
**Tagline:** "Every transaction leaves a trace."  
**Sharp corners** — border-radius: 2px max. Neon glow on interactive elements.

**Modal color coding:**
| Modal | Border | Trigger |
|-------|--------|---------|
| Acknowledgment | Cyan | Tier 3 download |
| Paywall | Pink | Download limit hit |
| Access Denied | Pink | Full-screen blocked |
| Subscription Expired | Pink | Sub lapsed |

---

## Access & Tier System

| Tier | Access | Templates |
|------|--------|-----------|
| 1 | All users (email gate) | Generic unbranded templates |
| 3 | Whitelist only (manually set in Sheet) | Branded templates: Shell, Airtel, PhonePe, Playo |

- Tier is stored in Google Sheet column C alongside email
- Returned from `/api/check-access`, stored in Zustand `useAccessStore`
- Template config has a `tier` property — templates only render if `userTier >= template.tier`
- Auth is now Google Sign-In (OAuth) — `google-sign-in` branch. Users identified by Google ID (column H), email as legacy fallback

---

## Google Sheets Database

**Sheet ID:** `1jtBM91d2PDZ_f5SOtpds14TbvnzYcoQNmCo9bWhzsj4`  
**Direct link:** https://docs.google.com/spreadsheets/d/1jtBM91d2PDZ_f5SOtpds14TbvnzYcoQNmCo9bWhzsj4/edit  
**Service account:** `billgen-sheets@billgen-487618.iam.gserviceaccount.com`

### Sheet1 — Users
| Col | Field | Notes |
|-----|-------|-------|
| A | email | lowercase, trimmed |
| B | downloadsUsed | integer |
| C | tier | 1 or 3 — edit this to upgrade a user |
| D | razorpaySubId | subscription ID |
| E | subscribedUntil | ISO timestamp |
| F | createdAt | ISO timestamp |
| G | tier3AckAccepted | TRUE/FALSE |
| H | googleId | from Google OAuth |
| I | banned | TRUE/FALSE — set TRUE to banish a user |

**To change a user's tier:** edit column C in Sheet1.  
Other tabs: `Downloads` (activity log), `Acknowledgments`, `Requests`, `Suggestions`.

All data access goes through `api/db/users.js`. Never query the Sheet directly from frontend.

---

## Monetisation

| Plan | Price | Limit |
|------|-------|-------|
| Free | ₹0 | 3 downloads |
| Subscribed | ₹149/month | Unlimited |

- Razorpay recurring subscription
- Renewal warning banner appears when ≤ 5 days remaining
- `PaywallModal` fires after the 3rd download if not subscribed
- Razorpay webhook at `/api/razorpay-webhook` updates `subscribedUntil`

---

## Legal Protection Layer

**Acknowledgment Modal** — shown ONCE per user for all tier 3 template downloads.
- Remembered via localStorage key `billgen-ack-accepted`
- On confirm: logged to Acknowledgments sheet tab
- No cancel button — user must acknowledge or leave
- Text: "This document is for personal record-keeping only. By downloading, you confirm you will not submit this as proof of a transaction to any employer, tax authority, insurance company, or financial institution."

**Terms of Service** — `/terms` route, unprotected, linked from footer.

**Tier 3 discoverability:** Zero. No SEO, no public links, no mentions anywhere. Direct URL + email gate only. Razorpay KYC sees only "generic document tool".

---

## Current Templates

| Template | Tier | Status |
|----------|------|--------|
| Driver Salary Receipt | 1 | Done |
| Petrol / Fuel Bill (Shell) | 3 | Done |
| Broadband Receipt (Airtel) | 3 | Done |
| Sports Booking (Playo) | 3 | Done |
| PhonePe Payment Receipt | 3 | Done |

---

## Template Roadmap

**Phase 1 — Launch critical (build before Jan 2027):**
- Rent Receipt (Tier 1) — 200–400K monthly searches
- Generic Fuel Receipt unbranded (Tier 1)
- Generic Broadband Bill unbranded (Tier 1)

**Phase 2 — Quick wins:**
Tuition Fee, Books & Newspaper, Toll Receipt, Internet Bill

**Phase 3 — Higher effort:**
Salary Slip, Medical Bill, Hotel Bill, Cab/Taxi Bill, Gym Receipt

**Phase 4 — Seasonal:**
LTA Travel Bill (old tax regime only), Home Loan Interest Statement

Full field specs for all templates are in `docs/template-roadmap.md`.

---

## Compliance Differentiator

Every template must include the relevant tax section label. This is the single biggest gap in existing tools.

| Template | Footer Label |
|----------|-------------|
| Rent Receipt | Section 10(13A) |
| Broadband Bill | Section 17(2) |
| Driver Salary | Section 10(14) |
| Fuel / Petrol | Section 10(14) |
| Medical Bill | Section 80D |
| Tuition Fee | Section 80C |
| LTA Travel | Section 10(5) — old tax regime only |
| Home Loan | Section 24(b) and Section 80C |
| Gym Receipt | Section 17(2) |

Revenue stamp space (dotted box, not an image) for cash payments > ₹5,000: Rent, Driver Salary.  
PAN field on Rent receipts (mandatory if annual rent > ₹1L).  
GSTIN fields on Hotel, Medical, Gym, Broadband.  
Full compliance reference in `docs/compliance-notes.md`.

---

## Supabase Migration Path

Google Sheets is the current DB and is fine until:
- Atomic transactions are needed (credits feature)
- Traffic crosses ~1000 active users (Sheets API rate limits)

Migration is a one-file change — all access goes through `api/db/users.js`.  
`DATA_SOURCE` env var switches between `sheets` and `supabase`.  
When migrating: create Supabase table with same schema → one-time sync script → flip env var.

---

## Key Decisions Log

| Date | Decision |
|------|----------|
| Jun 2026 | Replaced manual email entry with Google OAuth Sign-In (`google-sign-in` branch) |
| Jun 2026 | Added column H (googleId) to Sheet1 — lookup prefers googleId, falls back to email |
| Jun 2026 | Tier 3 acknowledgment stored per-user in Sheet column G (previously localStorage only) |
| Jun 2026 | Razorpay registered under neutral name "Document Tools" — not RavenLog |
| Jun 2026 | Free tier: 3 downloads. Paid: ₹149/month unlimited via Razorpay recurring |
| Jun 2026 | Logo upload is client-side only, base64 in state, never sent to backend |
| Jun 2026 | Ban system: Sheet1 column I (`banned`) = TRUE banishes a user. They see a full-screen "YOU HAVE BEEN BANISHED" screen with lightning, glitch text, and scan beam. Checked at sign-in and on every session revalidation. |
| Jun 2026 | Target launch date: before January 2027 to catch peak HRA proof season |

---

## Dev Setup

```bash
npm install
cp .env.example .env   # fill in GOOGLE_SHEET_ID, service account, Razorpay, Google client ID
npm run dev            # frontend on :5173
node api/server.js     # local API server on :3001 (VITE_API_URL=http://localhost:3001)
```

Vercel handles deployment — `api/` folder maps to serverless functions automatically.
