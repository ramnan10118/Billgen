# RavenLog — Compliance Notes

## Why Compliance is the Moat

Existing bill generators produce generic PDFs with no GSTIN fields, no PAN fields,
no revenue stamp space, no Section labeling. This is RavenLog's core differentiator —
every template is built to be submission-ready for Indian HR portals and ITR filing.

---

## Mandatory Compliance Fields by Template Type

### Revenue Stamp
Required when any single cash payment exceeds ₹5,000.
Applies to: Rent receipts, Driver salary receipts.
Implementation: Leave a designated blank space labeled "Affix ₹1 Revenue Stamp Here"
with a dotted border box. Do not print a fake stamp image.

### PAN Field
Landlord PAN is mandatory on rent receipts if annual rent exceeds ₹1,00,000.
Applies to: Rent receipts.
Implementation: Include PAN input field. Add note on document:
"PAN mandatory if annual rent exceeds ₹1,00,000 — Rule 26C"

### GSTIN Fields
Required on all B2B documents for input tax credit eligibility.
Applies to: Hotel bills, Medical bills, Gym receipts, Broadband bills.
Implementation: Supplier GSTIN + Customer GSTIN (optional) fields.

### HSN / SAC Codes
Required on GST invoices to classify the service.
| Service | Code |
|---------|------|
| Accommodation (hotel) | HSN 996311 |
| Gym / fitness | SAC 999723 |
| Medical services | SAC 999311 |
| Broadband internet | SAC 998422 |

### Section Labeling
Every document should carry a footer note indicating the relevant tax section.
This is the single biggest gap in existing tools.

| Template | Section Label to Print |
|----------|----------------------|
| Rent Receipt | For HRA Exemption — Section 10(13A) of the Income Tax Act |
| Broadband Bill | For WFH Perquisite Claim — Section 17(2) of the Income Tax Act |
| Books & Newspaper | For Reimbursement — Section 10(14) of the Income Tax Act |
| Driver Salary | For Vehicle Reimbursement — Section 10(14) of the Income Tax Act |
| Fuel / Petrol | For Vehicle Reimbursement — Section 10(14) of the Income Tax Act |
| Medical Bill | For Deduction — Section 80D of the Income Tax Act |
| Tuition Fee | For Deduction — Section 80C of the Income Tax Act |
| LTA Travel | For LTA Exemption — Section 10(5) of the Income Tax Act |
| Home Loan | For Deduction — Section 24(b) and Section 80C of the Income Tax Act |
| Gym Receipt | For Corporate Wellness Claim — Section 17(2) of the Income Tax Act |

---

## Form 12BB Context

Form 12BB (Rule 26C) is the standard form Indian employers use to collect
investment and reimbursement proofs from employees under Section 192(2D).

Most commonly required documents under Form 12BB:
- HRA rent receipts (Sec 10(13A))
- LTA travel bills (Sec 10(5))
- Home loan interest certificate (Sec 24(b))
- Other deductions (80C, 80D, 80G etc.)

Future feature: Form 12BB-ready summary that auto-fills based on documents generated.

---

## Seasonal Demand Calendar

| Period | Peak Document Types |
|--------|-------------------|
| January–March | Rent receipts (HRA proof deadline), LTA bills, ITR prep docs |
| March–April | Medical bills, insurance receipts, 80C documents |
| October–December | Mid-year investment declaration cycle restarts |
| Year-round | Fuel bills, driver salary slips, cab receipts (monthly claims) |

Peak season for RavenLog is January–March.
Target: All Phase 1 + Phase 2 templates live before January.

---

## LTA Important Note

LTA is NOT available under the new tax regime from FY 2025–26.
Only employees on the old tax regime can claim LTA exemption.
Add a disclaimer on the LTA template:
"LTA exemption available under old tax regime only — Section 10(5)"

---

## New Tax Regime Impact

Several exemptions are not available under the new tax regime (FY 2025–26 onwards):
- HRA exemption (Sec 10(13A)) — not available
- LTA exemption (Sec 10(5)) — not available
- Standard deductions under Sec 10(14) — not available

However, employer reimbursements (fuel, broadband, books) remain claimable
as non-taxable perquisites under Section 17(2) regardless of tax regime.

Add a subtle note on affected templates indicating old vs new regime applicability.
