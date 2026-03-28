# RavenLog — Architecture Decisions

## Current Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | React 19 + Vite + React Router 7 | |
| Styling | Custom CSS — cyberpunk/blade runner aesthetic | Rajdhani + Share Tech Mono fonts |
| State | Zustand with localStorage persistence | |
| Animations | Motion (Framer Motion) | |
| PDF Export | html2pdf.js | |
| Image Export | html2canvas | |
| Backend | Vercel serverless functions (api/ folder) | |
| Database | Google Sheets via service account | |
| Payments | Razorpay subscriptions | |
| Hosting | Vercel | |

---

## Tier System

| Tier | Access | Templates |
|------|--------|-----------|
| 1 | All users (email gate) | Generic unbranded templates |
| 3 | Whitelist only (email in Sheet) | Branded templates (Shell, Airtel, PhonePe, Playo) |

Tier is stored in Google Sheet alongside email.
Tier is returned from /api/check-access and stored in Zustand.
Template config has a `tier` property — templates only render if userTier >= template.tier.

---

## Access Control Flow

1. User enters email on AccessGate
2. /api/check-access POST — checks Google Sheet, creates user row if new
3. Returns: { valid, tier, downloadsUsed, downloadsLimit, isSubscribed, subscribedUntil, daysRemaining, renewalDue }
4. Stored in useAccessStore (Zustand, persisted to localStorage)
5. Re-validated on every protected route mount
6. Grace period: 24 hours — if Sheet unreachable, allow access based on cached state

---

## Download / Paywall Model

- Free tier: 3 downloads (downloadsLimit = 3)
- After 3 downloads: PaywallModal appears, Razorpay subscription required
- Subscription: ₹149/month via Razorpay recurring
- Subscription status tracked in Google Sheet (subscribedUntil column)
- Razorpay webhook updates subscribedUntil on payment success

---

## Google Sheets Schema

### Sheet1 (users)
| Column | Field | Notes |
|--------|-------|-------|
| A | email | lowercase, trimmed |
| B | downloadsUsed | integer |
| C | tier | 1 or 3 |
| D | razorpaySubId | subscription ID |
| E | subscribedUntil | ISO timestamp |
| F | createdAt | ISO timestamp |

### Downloads tab
email | template | format | timestamp

### Acknowledgments tab
email | templateId | timestamp | ip

### Requests tab
email | reason | timestamp

### Suggestions tab
email | suggestion | timestamp

---

## Legal Protection Layer

### Acknowledgment Modal
- Shows ONCE EVER for tier 3 templates
- Remembered via localStorage key: `billgen-ack-accepted`
- On confirm: logs to Acknowledgments sheet tab
- Body text: "This document is for personal record-keeping only. By downloading,
  you confirm you will not submit this as proof of a transaction to any employer,
  tax authority, insurance company, or financial institution."
- No cancel button — user must acknowledge or navigate away

### Terms of Service
- Lives at /terms — unprotected route
- Linked from footer on all pages
- Sections: Permitted Use, Prohibited Use, No Liability, Acknowledgment

### Tier 3 Positioning
- Branded templates are never publicly discoverable
- No SEO, no public pages, no mention anywhere
- Direct URL only, email-gated
- Razorpay KYC sees only generic document tool (Layer 1)

---

## Razorpay Registration

Register under neutral business name — NOT "RavenLog" or "BillGen".
Suggested name: "Document Tools" or "RecordKit"
This is the name that appears on Razorpay checkout and payment receipts.
The UI can still say RavenLog — these are separate.

---

## Future: Supabase Migration Path

Current Google Sheets backend is fine until:
- Credits go live and atomic transactions are needed
- Google/Supabase Auth is added for real session layer
- Traffic crosses ~1000 active users and Sheets API rate limits hit

Migration is a single file change — all data access goes through api/db/users.js.
DATA_SOURCE env variable controls which backend is active (sheets vs supabase).

When migrating:
1. Create Supabase users table with same schema
2. Run one-time sync script to copy Sheet data to Supabase
3. Flip DATA_SOURCE=supabase
4. Verify for one week, then remove Sheet code

---

## Logo Upload Feature

- Client-side only — base64 in component state
- Never sent to backend
- Accepted formats: PNG, JPG, SVG — max 2MB
- Renders top-right of generated document at max 48px height
- Does not persist across sessions
- Positioned as "Add your business logo" — for legitimate business use
- Skipped on PhonePe template variant
