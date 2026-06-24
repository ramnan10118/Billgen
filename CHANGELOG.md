# Changelog

All notable changes to RavenLog are recorded here.

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
