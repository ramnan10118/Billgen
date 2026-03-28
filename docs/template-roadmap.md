# RavenLog — Template Roadmap

## Current Templates (Built)

| Template | Tier | Status |
|----------|------|--------|
| Driver Salary Receipt | 1 | ✅ Done |
| Petrol / Fuel Bill (Shell) | 3 | ✅ Done |
| Broadband Receipt (Airtel) | 3 | ✅ Done |
| Sports Booking (Playo) | 3 | ✅ Done |
| PhonePe Payment Receipt | 3 | ✅ Done |

---

## Phase 1 — Launch Critical

| Template | Tier | Est. Monthly Searches | Priority |
|----------|------|----------------------|----------|
| Rent Receipt | 1 | 200,000–400,000 | 🔴 Highest |
| Generic Fuel Receipt (unbranded) | 1 | 80,000–150,000 | 🔴 High |
| Generic Broadband Bill (unbranded) | 1 | 15,000–35,000 | 🔴 High |

---

## Phase 2 — Quick Wins (Low Competition)

| Template | Tier | Est. Monthly Searches | Competition | Notes |
|----------|------|----------------------|-------------|-------|
| Internet / Broadband Bill | 1 | 15,000–35,000 | Low | WFH perquisite angle, Sec 17(2) |
| Tuition / Coaching Fee Receipt | 1 | 10,000–25,000 | Very Low | 80C demand is permanent |
| Books & Newspaper Bill | 1 | 8,000–20,000 | Very Low | Barely anyone covers this |
| Toll Receipt | 1 | 5,000–12,000 | Almost zero | First mover opportunity |

---

## Phase 3 — Harder But High Value

| Template | Tier | Est. Monthly Searches | Competition | Notes |
|----------|------|----------------------|-------------|-------|
| Salary Slip / Payslip | 1 | 150,000–300,000 | Very High | Differentiate on design quality |
| Medical Bill / Hospital Receipt | 1 | 30,000–60,000 | Moderate | 80D angle, GST compliance gap |
| Hotel Bill | 1 | 20,000–40,000 | Moderate | GST compliance is the gap |
| Cab / Taxi Bill | 1 | 15,000–30,000 | Moderate | Ola/Uber format gap |
| Gym / Fitness Receipt | 1 | 8,000–15,000 | Low | Corporate wellness trend |

---

## Phase 4 — Seasonal + High Value

| Template | Tier | Est. Monthly Searches | Competition | Notes |
|----------|------|----------------------|-------------|-------|
| LTA Travel Bill | 1 | 40,000–80,000 | Moderate | Peak Jan–Mar. Not available under new tax regime FY2025-26 |
| Home Loan Interest Statement | 1 | 40,000–80,000 | ZERO | Banks issue official ones, no generator exists. First mover. |

---

## Template Field Specs

### Rent Receipt
- Tenant name, landlord name
- Property address
- Rent amount, payment mode
- Billing period (month/year)
- Landlord PAN (mandatory if annual rent > ₹1L)
- Revenue stamp space for cash payments > ₹5,000
- Compliance: Section 10(13A)

### Internet / Broadband Bill
- ISP name (user input, no branding)
- Customer name, account number
- Plan name, billing period
- Amount paid, payment date
- Payment mode
- Compliance: Section 17(2) — label must appear on document

### Tuition / Coaching Fee Receipt
- Institute name, address
- Student name
- Course/class name
- Fee amount, period
- Receipt number, date
- GSTIN field
- Compliance: Section 80C — up to 2 children

### Books & Newspaper Bill
- Store/vendor name
- Employee name
- Item description (book title / publication name)
- Amount, date of purchase
- Receipt number
- Compliance: Section 10(14) — fully exempt on actuals

### Toll Receipt
- Toll plaza name, highway
- Vehicle number
- Date, time
- Amount paid
- Transaction ID
- Compliance: General travel reimbursement

### Salary Slip / Payslip
- Employee name, designation, department
- Employee ID, PAN
- Basic, HRA, DA, other allowances
- PF, TDS, other deductions
- Net pay, bank account (masked)
- Month, company name, company address
- Compliance: General

### Medical Bill / Hospital Receipt
- Hospital/pharmacy name, address, GSTIN
- Patient name
- Doctor name (optional)
- Treatment/medicine description
- Amount, date
- Receipt number
- HSN/SAC code
- Compliance: Section 80D

### Hotel Bill
- Hotel name, address, GSTIN
- Guest name
- Check-in, check-out dates
- Room type, tariff per night
- CGST/SGST breakdown
- Total amount
- HSN code: 996311 (accommodation services)
- Compliance: General travel reimbursement

### Cab / Taxi Bill
- Cab company name (user input)
- Passenger name
- Pickup, drop location
- Date, time
- Distance, fare breakdown
- Driver name, vehicle number
- Receipt/trip ID
- Compliance: General travel reimbursement

### LTA Travel Bill
- Mode of travel (air/train/bus)
- Traveller names (self + family)
- Origin, destination
- Journey date
- Ticket/PNR number
- Amount
- Compliance: Section 10(5)

### Home Loan Interest Statement
- Lender name, branch
- Borrower name
- Loan account number
- Property address
- Financial year
- Principal repaid
- Interest paid
- Outstanding balance
- Compliance: Section 24(b) up to ₹2L, Section 80C for principal

### Gym / Fitness Receipt
- Gym name, address, GSTIN
- Member name
- Membership type, duration
- Amount, date, receipt number
- SAC code: 999723
- Compliance: Section 17(2) corporate wellness
