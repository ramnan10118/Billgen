# Changelog

All notable changes to RavenLog are recorded here.

---

## [Unreleased] — monthly-bill-testing branch (2026-06-30)

### Added
- **Recurring auto-bill engine** — a schedule now produces a *set* of freshly-generated bills each month instead of re-sending one frozen copy. New shared, framework-free module `src/utils/recurringBill.js` (used by both the cron and the frontend):
  - `generateMonthlyBills()` — regenerates each bill's date (a distinct day in the current month), all auto-generated IDs (txn/receipt/UTR), and the amount.
  - `splitAmount(total, n)` — splits a monthly rupee target into `n` jittered parts that sum exactly to the target.
  - `RECURRING_CONFIG` — per-template strategy: `direct` amount field (driver/broadband/upi/playo) or `derived` (petrol: keeps rate fixed, back-solves quantity).
  - `getEngineOwnedFieldIds()` — fields the engine overwrites, hidden in the wizard.
- **Setup wizard** — new `/setup` route (`src/pages/SetupWizard.jsx`): pick template → fill persistent fields → set monthly ₹ target + split count + delivery day → "Set it in motion." Anyone can configure; delivery is **paid-to-activate**. Home banner now links to it.
- **`sendMonthlyBillsEmail()`** in `api/_email.js` — one email with a download button per split bill.

### Changed
- **`Schedules` sheet** — added columns **G `monthlyTarget`** and **H `splitCount`**; `api/schedule.js` reads/writes `A:H`.
- **Monthly-delivery cron** (`api/cron/monthly-delivery.js`) — generates N bills via the engine, gates each user on `checkSubscription()` (paid-to-activate), sends one multi-link email, and now requires `Authorization: Bearer ${CRON_SECRET}`.
- **Settings → Monthly Bill Delivery** — now a view/edit/pause panel for the existing schedule (summary + pause/resume + "Edit setup" → wizard); removed the old stale-defaults save path.
- **Field rendering** extracted from `Generator.jsx` into shared `src/components/BillFieldsForm.jsx`; the `autoGenerate` map is now `AUTO_GENERATORS` in `recurringBill.js` (single source of truth).

### Revised (2026-07-01)
- **Multiple bills per schedule** — the wizard is now multi-select: pick several templates (fuel + broadband + …) in one setup; each is delivered monthly as one bill in a single email.
- **Amount input dropped** — no more monthly-target/split step. Amounts are whatever you set on the bill; the engine only refreshes date + IDs. (`splitAmount`/target mode kept dormant in `recurringBill.js` for later.)
- **Preview step** — the wizard now renders this month's actual generated bills (via `BillPreview`) with a "Regenerate" button before you activate.
- **Nav links added** — `Automate` (`/setup`) and `Settings` (`/settings`) now appear in the header nav (were previously URL-only).
- **Delivery day 1–31** — cron clamps 29/30/31 to the month's last day (so day 31 fires on Feb 28); was capped at 28.
- **Schedule storage** — `Schedules` row is now `A email | B templatesCsv | C config JSON [{templateId, fields}] | D deliveryDay | E enabled | F updatedAt` (columns G/H no longer used). Legacy single-template rows are read transparently.
- **Test escape hatch** — `SKIP_SUBSCRIPTION_GATE=true` makes the cron deliver to everyone, bypassing the paid gate for local testing.

### Revised (2026-07-06) — split engine, ZIP delivery, wizard redesign

#### Split & frequency engine (`src/utils/recurringBill.js`)
- **Amount splitting re-activated** — each bill type has a **total ₹** and a **number of splits**; the engine divides the total into that many bills (jittered, summing exactly to the total). `n = 1` is just a single bill.
- **Weekday-aware dates** — `spreadWeekdayDates(n, start, end)` distributes bill dates across weekdays only (never Sat/Sun). `spreadDates()` now delegates to it.
- **Frequency window** — `billDateRange(frequency, now)` returns the date window bills fall in: previous complete month (`once`/`monthly`) or previous two months (`bimonthly`).
- **Auto-varied fields** — new `variableFields` in `RECURRING_CONFIG` regenerate per bill so no two look identical:
  - Petrol: `transactionTime`, `fuelCode`, `pointsEarned` (scales with litres), `bonusPoints`.
  - Playo: `court`, `slotTime`, `convenienceFee` (% of price), `discount`, `advancePaid` (= court + fee − discount, kept internally consistent), `bookingTime`.
- **Constant hidden fields** — new `constantFields` (broadband `paymentType`, `fixedLineNumber`): hidden from setup but **not** regenerated, so the fixed line number stays identical on every bill. New `getConstantFieldIds()` / `getAmountOwnedFieldIds()` helpers; the wizard hides engine-owned + amount-owned + constant fields from the details step.

#### One-link ZIP delivery (replaces per-bill magic links)
- **`/download` page** (`src/pages/DownloadBills.jsx` + CSS) — decodes all bills from one base64url token, renders each at full fidelity off-screen, packages them into a single **ZIP** (`src/utils/zipBills.js`, `jszip`), and auto-downloads. Branded "Preparing your bills…" progress → done/error states. Unprotected route (opened from email).
- **`exportToPDFBlob()`** added to `exportUtils.js` — renders a bill to a PDF Blob (for zipping) instead of saving.
- **Email** — `sendMonthlyBillsEmail()` now sends **one** "Download all bills" button + a bill list, instead of a link per bill.
- **base64url everywhere** — bill payloads are URL-safe (`+`/`/` no longer corrupted by `URLSearchParams`); the Generator decodes both base64url and legacy base64.
- **Shared `startSubscription()`** (`src/utils/subscribe.js`) — the Razorpay create-order → checkout → verify flow, reused by PaywallModal, SubscriptionExpired, and the wizard.

#### Wizard redesign (`src/pages/SetupWizard.jsx`)
- **3 steps** — (1) **Amount & frequency**: segmented Once / Every month / Every 2 months, delivery day, and per-bill **total + split count**; (2) **Details**: wider two-pane layout, one bill at a time, with a live **"Sample Bill"** preview on the right (only meaningful fields shown); (3) **Launch**: summary → "Set it in motion."
- **Subscribe button** added to the upsell blocks (was a dead end before).
- **Required-dropdown validation** — empty `select` fields block "Next" with a hint; `BillFieldsForm` now shows an explicit "Select …" placeholder instead of silently displaying option[0] while storing `''`.
- **Auto-download StrictMode fix** — the magic-link auto-download guard flips only when the download fires, so React 18 StrictMode's dev double-invoke no longer cancels it.

#### Home & Settings
- **Home "Next delivery" card** — once a schedule exists, the "Set up monthly bills" CTA is replaced by a card with a big next-delivery date on the left and the bills (with split counts) + frequency + "Edit setup" on the right. Date computed from frequency + delivery day.
- **Settings — Delete & start over** — new `delete` action in `api/schedule.js` (removes the row via `deleteDimension`); Settings has a confirm-gated reset. Pause/Resume now preserves `frequency`.

#### Storage & cron
- **`Schedules` sheet** — now `A:G`; **column G = `frequency`** (`once`/`monthly`/`bimonthly`). Config JSON (col C) extended to `[{templateId, fields, total, splits}]`. Legacy rows read transparently.
- **Cron** (`api/cron/monthly-delivery.js`) — applies each template's total/splits and the frequency date window; flattens all bills into one ZIP token; `once` schedules self-disable after sending; `bimonthly` fires only on even-cadence months.
- **`scripts/ensure-schedules-tab.mjs`** — idempotent script that creates the `Schedules` tab + header if missing.

### Revised (2026-07-07) — cycle dates, single-page PDFs, profile removal, polish

#### Bill dates → billing-cycle window (`src/utils/recurringBill.js`)
- **`billDateRange(frequency, deliveryDay, now)`** now returns the cycle **from the delivery day one cycle back to the delivery day now** (e.g. delivery on the 12th → Jun 12 → Jul 12), instead of the whole previous calendar month. Reads the live system date, so it's always relative to when it runs. Cron passes the schedule's delivery day.
- **`spreadWeekdayDates` is now stratified** — it allocates the bill count to each calendar month in the window *proportional to that month's weekday share* (largest-remainder rounding), then draws random dates within each. The earlier month reliably gets more bills even for a small batch (was only true on average with pure random). Weekends still skipped.
- **`getBillAmount(templateId, fields)`** — a bill's rupee amount (direct field, or petrol's qty × rate).

#### Single-page PDFs (`src/utils/exportUtils.js`)
- Dropped **html2pdf.js**; PDFs are now rendered via `html2canvas` + **jsPDF** directly onto one exactly-sized page. Fixes the **blank second page** on the Shell/Petrol bill (its `min-height: 956px` tripped html2pdf's floating-point pagination). Applies to both the ZIP and the direct Generator download.

#### ZIP file names
- Each PDF in the ZIP is now **`₹<amount> <Bill Name> <n>`** (amount first, then name, then a per-template index) — e.g. `₹4358 Petrol Bill 1.pdf`. Amounts across a template sum to the total entered.

#### Profile removed
- Deleted the whole **Profile** concept: `useProfileStore`, the Settings profile form, and the (dead) onboarding path. Profile was localStorage-only and half its fields (address, phone, profile email) fed no template.
- The user's **name is now derived from their email** via new `nameFromEmail()` (`ramnan10118@…` → "Ramnan"), used wherever a bill needs the name. Driver name / vehicle number are typed inline when needed (rarely).

#### Wizard, nav & Settings polish
- **Frequency is a radio group** (radio dial + label/subtext); **"Just once" removed** — now Monthly / Every 2 months only.
- **Live date-window example** under the delivery-day field, referencing the next upcoming delivery ("dates between Jun 12 and Jul 12, mostly June").
- **Auto/constant fields hidden from setup**: petrol (transaction time, fuel code, points, bonus — auto-varied), playo (court, slot time, convenience fee, discount, advance paid, booked-on time — auto-varied), broadband (payment type, fixed line number — constant, unchanging).
- **Layout**: Amount/Launch steps widened to 860px; bill rows left-aligned with subtext removed; frequency card titles left/top-aligned (overrode the global `button` centering); Settings panel re-padded (no more edge-flush rows / empty gap).
- **Nav**: removed the redundant **Automate** tab; renamed **Settings → "Bill Delivery Settings"**.

### Manual steps before deploy
- Set `CRON_SECRET` env var in Vercel (cron auth).
- Run `node scripts/ensure-schedules-tab.mjs` against the **production** Sheet (adds the `Schedules` tab + `frequency` header if missing).
- `html2pdf.js` is no longer used (jsPDF used directly) — safe to drop from `package.json` later.
- Restore `VITE_APP_URL=https://ravenlog.in` (pointed at `http://localhost:5173` during local testing; backup at `.env.bak.billtest`).
- Deploy this branch so the `/download` page + one-link ZIP flow exist in production.
- `jszip` is a new dependency (already in `package.json`).
- (Optional) label `Schedules` columns B/C as `templates`/`config` for readability.

---

## [Unreleased] — email-test branch (2026-06-27 to 2026-06-30)

### Added
- **Welcome email** — sent to every new user on first sign-in via `sendWelcomeEmail()` in `api/_email.js`. Cyberpunk-styled HTML template. Fires fire-and-forget from `createUser` so email failure never blocks sign-in.
- **Resend domain verification** — `ravenlog.in` added and verified in Resend (DKIM, SPF, MX records added in Namecheap).

### Changed
- **API consolidation** — reduced from 15 → 11 serverless functions to stay under Vercel Hobby plan limit (12 max). Merged 7 files into 3 using `action` field routing:
  - `payments.js` — replaces `create-order.js`, `verify-order.js`, `verify-payment.js`
  - `schedule.js` — replaces `save-schedule.js`, `get-schedule.js`
  - `activity.js` — replaces `log-download.js`, `log-acknowledgment.js`
- **Resend lazy init** — `new Resend()` moved inside `getResend()` function so missing env var at module load time no longer crashes every function that imports `_email.js`.

### Vercel Config Fixed
- Production Branch set to `main` under Settings → Environments
- Ignored Build Step set to Automatic (removed manual branch filter command)
- All env vars (`VITE_GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_ID`, `RESEND_API_KEY`, `GOOGLE_PRIVATE_KEY`) enabled for Preview environment

### Pending
- Add DMARC TXT record in Namecheap to reduce spam placement: Host `_dmarc`, Value `v=DMARC1; p=none;`
- Merge `email-test` → `main` once spam issue resolved

---

## [Unreleased] — subscription-email branch

### Added
- **Payment confirmation email** — sent immediately after successful ₹149 payment via Resend
- **Subscription reminder emails** — daily cron job (4 AM UTC) emails users with ≤ 5 days remaining
- **Monthly bill delivery** — user configures a template + delivery day in Settings; cron job (3 AM UTC) sends a magic link email that opens the app pre-filled and auto-downloads the PDF
- **Server-side schedule storage** — new "Schedules" tab in Google Sheet (email, templateId, fieldData JSON, deliveryDay, enabled, updatedAt)
- **Magic link support in Generator** — `?data=BASE64_JSON` URL param pre-fills the form and auto-triggers PDF download after 1.8s
- **Resend** email service integration (`api/_email.js`)
- **Vercel cron jobs** in `vercel.json` — reminders at `0 4 * * *`, monthly delivery at `0 3 * * *`
- `api/save-schedule.js` and `api/get-schedule.js` endpoints
- Monthly Delivery section in Settings (visible to subscribed users only)

### Environment variables added
- `RESEND_API_KEY` — Resend API key
- `VITE_APP_URL` — base URL for magic links (https://ravenlog.in)

---

## [Unreleased] — google-sign-in branch

### Added
- **Google OAuth Sign-In** — replaced manual email entry with Google Sign-In button. Users authenticate via Google; identified by Google ID (Sheet1 col H), email as legacy fallback.
- **Ban system** — set column I (`banned`) to `TRUE` in Sheet1 to banish a user. They see a full-screen "YOU HAVE BEEN BANISHED" takeover with CSS glitch animation, lightning bolts, and scan beam. Checked at sign-in and on every session revalidation.
- **CLAUDE.md** — project context file for Claude Code sessions. Captures stack, Sheet schema, tier system, monetisation, compliance rules, and decision log.
- **CHANGELOG.md** — this file.

### Changed
- **Petrol bill — fuel type options are now tier-based**: Tier 1 sees Petrol / Diesel / Gas; Tier 3 sees V-Power UNL, V-Power Diesel, V-Power Nitro+, FuelSave UNL, FuelSave Diesel + basics. Defaults to Petrol.
- **Petrol bill — total amount is now auto-calculated** (quantity × rate − discount). Removed the manual Total Amount input field.
- **Petrol bill — discount is now a toggle**. Off by default. When enabled, Discount (₹) and Discount Description fields appear and total adjusts live.
- **Petrol bill — "Transaction details" header**: black for Tier 1, Shell red for Tier 3.
- **Driver salary — revenue stamp**: hidden for Tier 1, shown for Tier 3.
- **Google Sheet schema**: added column I (`banned`, TRUE/FALSE) to Sheet1.

---

## [0.3.0] — Tier-based access & subscriptions

### Added
- Tier system: Tier 1 (all users, generic templates) and Tier 3 (whitelist, branded templates).
- Freemium model: 3 free downloads, then ₹149/month via Razorpay recurring subscription.
- `PaywallModal` — fires after 3rd download if not subscribed.
- `SubscriptionExpired` screen — full-screen renewal prompt when subscription lapses.
- `RenewalBanner` — non-blocking banner when ≤ 5 days remaining.
- UPI Payment Receipt template (Tier 3).
- Acknowledgment modal for Tier 3 templates — shown once, logged to Sheets.
- Terms of Service page at `/terms`.
- Google Sheets DB layer (`api/db/users.js`) — single source of truth for all user state.
- Razorpay webhook (`/api/razorpay-webhook`) to update subscription status on payment.
- Logo upload — client-side only, base64 in state, renders top-right of document.

### Changed
- Sheet1 schema expanded: added tier, razorpaySubId, subscribedUntil, createdAt, tier3AckAccepted columns.
- Access check now returns full user payload: tier, downloads, subscription status, renewal state.

---

## [0.2.0] — Templates & export polish

### Added
- Playo Sports Booking template (Tier 3) with auto-calc for total/advance/payable.
- Custom date picker component.
- ID randomizer for transaction IDs.
- Diagonal watermark on exports.
- Coming Soon banner on Home page.
- Template suggestion section with votes wired to Google Sheets.

### Changed
- Template renames and label style fixes.
- Fixed image skewing on PDF/PNG export.
- Fixed PDF whitespace by targeting template element directly.
- Shell logo explicit dimensions enforced to prevent skewing.

---

## [0.1.0] — Initial launch

### Added
- 5 bill templates: Driver Salary Receipt, Shell Petrol Bill, Airtel Broadband Receipt, Playo Sports Booking, PhonePe Payment Receipt.
- Google Sign-In access gate (email-based at the time).
- Google Sheets backend for access control and download tracking.
- Request Access modal with reason field.
- Full-screen ACCESS DENIED takeover.
- PDF, PNG, JPG export via html2pdf.js and html2canvas.
- Zustand state with localStorage persistence (profile, access, template defaults).
- Cyberpunk / Blade Runner aesthetic — Rajdhani + Share Tech Mono, neon cyan/pink, animated grid background.
- Vercel hosting with serverless API functions.
