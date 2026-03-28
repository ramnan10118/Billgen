# RavenLog — Brand & Product Decisions

## Name

**Product name:** RavenLog  
**Domain:** ravenlog.in  
**Razorpay / KYC name:** Document Tools (or RecordKit) — neutral, not RavenLog  
**Codebase name:** Can stay BillGen internally — Razorpay never sees the codebase  

---

## Aesthetic

**Direction:** Cyberpunk / Blade Runner / Retro-futurist  
**Reference:** Blade Runner 2049 — dark, neon, terminal/command line energy  

**UI wordmark:** RΛVEN_LOG (lambda for A, underscore for terminal feel)  
**Tagline:** "Every transaction leaves a trace."  
**System label:** SYS V.2.0 // ONLINE  

---

## Color Tokens

| Token | Value | Usage |
|-------|-------|-------|
| Accent primary | #06b6d4 (cyan) | Primary actions, active states, glow |
| Accent secondary | #ec4899 (pink) | Paywall, danger states, secondary glow |
| Accent purple | #a855f7 | Coming soon, settings |
| Accent success | #22c55e | Success states |
| Background primary | #050505 | Page background |
| Background secondary | #0d0d12 | Cards, panels |
| Border color | #2d303e | Default borders |
| Text primary | #e2e8f0 | Headings, important text |
| Text muted | #64748b | Secondary labels, hints |

---

## Typography

| Font | Usage |
|------|-------|
| Rajdhani | Headings, UI labels — uppercase, letter-spaced |
| Share Tech Mono | Form labels, code, mono elements, system text |

---

## Design Principles

- Dark backgrounds always — never light mode
- Neon glow on interactive elements (box-shadow with accent color)
- Sharp corners — border-radius: 2px maximum
- Grid background with slow drift animation
- Floating particles (cyan, pink, purple)
- Scan beam animation on full-screen states
- Cyberpunk card style: gradient dark background + inset highlight border

---

## Modal Color Coding

| Modal | Top Border Color | Purpose |
|-------|-----------------|---------|
| Acknowledgment | Cyan (#06b6d4) | Tier 3 download confirmation |
| Paywall | Pink (#ec4899) | Subscription required |
| Access Denied | Pink (#ec4899) | Full screen denied state |
| Subscription Expired | Pink (#ec4899) | Renewal required |

---

## Positioning

**What RavenLog is:**
A document generation tool for Indian professionals — built for expense
reimbursement submissions, tax proof filing, and personal record keeping.

**Who it's for:**
Salaried Indian employees who submit monthly expense claims and annual
tax proofs to their employers. 50M+ salaried workforce in India submits
these twice a year creating permanent cyclical demand.

**The moat:**
Design quality + compliance features (GSTIN, PAN, Section labeling,
revenue stamp space) that existing generic tools completely ignore.

**What it is NOT:**
A fake bill generator. All templates are for legitimate record keeping.
Acknowledgment modal + ToS make this explicit and shift liability to users.

---

## Monetisation

| Tier | Price | Access |
|------|-------|--------|
| Free | ₹0 | 3 downloads |
| Subscribed | ₹149/month | Unlimited downloads |

Payment: Razorpay recurring subscription  
Renewal warning: Banner appears when ≤ 5 days remaining  

---

## Market Context

India's salaried workforce: 50M+ employees  
Proof submission cycles: 2x per year (Jan–Mar peak, Oct–Dec secondary)  
Total addressable market for document generators: Large, cyclical, permanent  
Peak traffic season: January–March (HRA proof deadline, ITR prep)  
Target live date: Before January 2027 to catch peak season  
