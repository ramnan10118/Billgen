# PRD: Bill Template Generator

## 1. Overview

A personal tool to quickly generate bills and documents (electricity, internet, rent, etc.) using pre-built templates. Instead of manually editing a document every month, the user simply fills in variable fields (name, date, amount) and exports a ready-to-submit PDF or image — primarily for monthly reimbursement submissions.

---

## 2. Problem Statement

Every month, a user needs to submit bills/documents for reimbursement. The current workflow involves opening an old document, manually editing fields in a design/editing tool, exporting, and uploading. This is:

- **Time-consuming** — 10-15 mins per document for what should be a 30-second task
- **Error-prone** — easy to forget updating a date or misspell something
- **Unnecessarily complex** — requires familiarity with editing tools for a simple data-swap task

## 3. Proposed Solution

A lightweight web app with pre-built bill templates where the user inputs only the variable data, previews the output, and exports as PDF or image in one click.

---

## 4. User Persona

**Primary users:** Personal use + small circle of friends
- Need to generate 3-6 bills monthly for reimbursement
- Want speed and consistency over customisation
- Comfortable with basic web interfaces
- Submit documents as PDF or image (JPG/PNG)
- Each user runs the tool on their own device (no shared accounts)

---

## 5. Access Control (P0 — Invite Only)

### 5.1 How It Works

The app is invite-only. Access is controlled via a Google Sheet maintained by the admin (Ramnan). The sheet contains a single column of approved email IDs. The app validates against this list on every session.

### 5.2 Admin Workflow (Google Sheet)

- **Grant access:** Add the person's email to the sheet
- **Revoke access:** Delete the person's email from the sheet
- **Effect:** Immediate — next time the user opens the app, access is denied/granted

No admin dashboard needed. The Google Sheet *is* the admin panel.

### 5.3 User Access Flow

```
Open App → Enter Email → App checks Google Sheet → Match? → Access Granted
                                                 → No match? → "Access Denied" screen
```

- **First visit:** User enters email → validated against the sheet → if approved, email is cached in LocalStorage
- **Returning visits:** App re-validates the cached email against the sheet on every session start (so revocation takes effect immediately)
- **Revoked user:** Sees a clean "Access revoked" screen with a message to contact the admin
- **No account/password needed** — email is the only identifier

### 5.4 Technical Notes

- Use Google Sheets API (read-only) to check the email list
- API key is restricted to read-only access on that one sheet
- The sheet ID and API key are environment variables, not hardcoded
- Validation happens on every app launch (not just first time) to ensure revocations are enforced
- If the sheet is unreachable (network error), allow access based on cached state with a grace period (e.g., 24 hours) to avoid locking out users due to connectivity issues

---

## 6. Core User Flows

### 6.1 First-Time Setup Flow
```
Access Granted → Onboarding Nudge → Settings/Profile Page → Save → Redirect to Home
```

On first launch (no profile detected in LocalStorage), the app prompts the user to fill out their profile. This is a one-time setup. Users can skip and fill later, but the nudge should be clear about the benefit ("Fill this once, never type your name again").

### 6.2 Bill Generation Flow
```
Select Template → Variable Fields (pre-filled from profile + last-used) → Preview → Export
```

**Step-by-step:**

1. User opens the app
2. Selects a bill type (e.g., Electricity Bill, Internet Bill, Rent Receipt)
3. A form appears with only the variable fields for that template — common fields (name, address) are already filled from the saved profile
4. User fills/adjusts the remaining fields (some auto-populated with last-used values)
5. Live preview updates in real-time
6. User clicks "Export as PDF" or "Export as Image"
7. File downloads instantly

---

## 7. Settings / Profile Page

A simple form that saves personal details to LocalStorage. Accessible anytime from the nav/header.

### 6.1 Profile Fields

| Field | Purpose | Used In |
|---|---|---|
| **Full Name** | Auto-fills customer/tenant name across all templates | All templates |
| **Address** | Auto-fills billing/property address | Electricity, Gas, Rent, Internet |
| **Phone Number** | Auto-fills contact number | Mobile Bill, Internet |
| **Email** | Auto-fills email where applicable | Internet, Generic Invoice |
| **Landlord Name** | Auto-fills landlord field in rent receipts | Rent Receipt |

### 6.2 Design Notes

- Keep it a single, clean form — no tabs or sections needed for this few fields
- Show a "Profile saved" confirmation on save
- Display a subtle indicator on the home screen when profile is incomplete (e.g., "Complete your profile to auto-fill bills faster")
- All data stored in LocalStorage — no accounts, no login, no backend
- Each user on their own device has their own independent profile

---

## 6. Template Types (Initial Set)

| Template | Variable Fields |
|---|---|
| **Electricity Bill** | Customer name, billing address, account/consumer number, billing period, units consumed, amount, due date, bill date |
| **Internet / Broadband Bill** | Customer name, plan name, account ID, billing period, amount, bill date, due date |
| **Rent Receipt** | Tenant name, landlord name, property address, rent amount, month/period, payment date, payment mode |
| **Mobile / Phone Bill** | Customer name, mobile number, plan, billing period, amount, bill date |
| **Gas Bill** | Customer name, consumer number, billing period, units, amount, bill date |
| **Generic Invoice** | From name, to name, description, amount, invoice number, date |

Each template has a fixed visual layout mimicking a realistic bill format.

---

## 7. Features

### 7.1 MVP (v1.0)

| Feature | Description |
|---|---|
| **Pre-built templates** | 4-6 realistic bill templates with fixed layouts |
| **Variable field form** | Dynamic form based on selected template; only editable fields shown |
| **Live preview** | Real-time preview of the generated bill as the user types |
| **PDF export** | One-click download as PDF |
| **Image export** | One-click download as PNG/JPG |
| **Auto-fill defaults** | Remember last-used values per template (stored locally) so the user only changes what's different month-to-month (e.g., date, amount) |
| **Date helpers** | Quick-pick for "This month", "Last month" to auto-fill billing period and dates |

### 7.2 Nice-to-Have (v2.0)

| Feature | Description |
|---|---|
| **Batch generation** | Generate multiple bills at once (e.g., all monthly bills in one go) |
| **History log** | View/re-download previously generated bills |
| **Custom templates** | Allow creating new templates from scratch |
| **Cloud sync** | Sync defaults and history across devices |
| **Auto-increment** | Auto-increment invoice/bill numbers each month |
| **Randomisation helpers** | Subtle variations in amounts or formatting to avoid identical-looking bills |

---

## 8. Technical Approach

Since this is a personal tool, keep it lightweight:

- **Frontend:** React (Vite + React) — component-based architecture handles dynamic forms, live preview, routing, and state cleanly
- **Routing:** React Router for navigation between access gate, home, generator, and settings
- **State management:** React Context or Zustand for global state (user profile, access status)
- **Template rendering:** React components styled with CSS to replicate real bill layouts
- **PDF generation:** html2pdf.js or react-to-print for PDF export
- **Image export:** html2canvas for PNG/JPG capture
- **Data persistence:** LocalStorage for profile, defaults, and cached access state
- **Access validation:** Google Sheets API (read-only) for invite-only email check
- **Hosting:** Vercel or Netlify (free tier, auto-deploys from Git)

No traditional backend. Google Sheet is the only external dependency.

---

## 9. Template Design Principles

- Templates should look **realistic and professional** — mimicking actual utility bills
- Use appropriate brand-neutral styling (generic logos, standard fonts)
- Include static elements that real bills have: company header, barcode placeholder, terms text, payment summary boxes
- Variable fields should blend seamlessly — no "form field" appearance in the output
- Slight visual variation between templates (colour schemes, layouts) so they don't all look like they came from the same tool

---

## 10. Information Architecture

```
Home
├── Template Selector (grid of bill types)
├── Generator View
│   ├── Left: Input Form (variable fields, pre-filled from profile)
│   └── Right: Live Preview
├── Export Options (PDF / PNG / JPG)
└── Settings
    ├── User Profile (name, address, phone, email, landlord name)
    ├── Saved Defaults per template
    └── Export preferences (quality, size)
```

---

## 11. Success Metrics

Since this is a personal tool, success is simple:

- **Time to generate a bill:** < 60 seconds (down from 10-15 mins)
- **Monthly usage:** Tool is actually used every month instead of falling back to manual editing
- **Zero friction:** No login, no setup, open → fill → export

---

## 12. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Templates look too generic/fake | Invest time in realistic template design; study actual bill formats |
| PDF rendering inconsistencies | Test across browsers; use proven libraries (html2pdf.js) |
| LocalStorage data loss | Keep it simple — data is just defaults, easy to re-enter. V2 can add cloud backup |

---

## 13. MVP Scope & Timeline

**Target:** Build and ship in 1-2 weekends

| Phase | Scope | Time |
|---|---|---|
| **Phase 1** | 2-3 templates + form + live preview + PDF export | Weekend 1 |
| **Phase 2** | Image export + auto-fill defaults + remaining templates | Weekend 2 |
| **Phase 3** | Polish, edge cases, realistic template styling | Ongoing |

---

## 14. Open Questions

1. Are there specific bill formats (from specific providers) that need to be closely replicated, or is "realistic-looking generic" sufficient?
2. Should the tool support A4 and letter size, or just A4?
3. Any specific fields needed beyond what's listed per template?
