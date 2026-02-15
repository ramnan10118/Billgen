# BillGen - Bill Template Generator

A personal tool to quickly generate bills and documents for monthly reimbursement submissions.

## Features

- **6 Bill Templates**: Electricity, Internet, Rent Receipt, Mobile, Gas, Generic Invoice
- **Smart Auto-fill**: Profile data and last-used values pre-populate forms
- **Live Preview**: Real-time preview as you type
- **One-click Export**: Download as PDF, PNG, or JPG
- **Date Helpers**: Quick-pick buttons for "This month", "Last month", "+15 days"
- **Invite-only Access**: Google Sheet controls who can use the app

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Google Sheets Access (Optional)

If you want to enable invite-only access control:

1. Create a Google Sheet with approved email addresses in column A
2. Enable Google Sheets API in Google Cloud Console
3. Create an API key with read-only access to Google Sheets API
4. Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

**Note**: Without Google Sheets configuration, the app runs in "dev mode" where all emails are accepted.

### 3. Run Development Server

```bash
npm run dev
```

### 4. Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── AccessGate.jsx   # Email validation gate
│   ├── Layout.jsx       # App layout with nav
│   └── BillPreview.jsx  # Bill template rendering (CUSTOMIZE THIS)
├── pages/               # Route pages
│   ├── Home.jsx         # Template selector
│   ├── Settings.jsx     # Profile settings
│   └── Generator.jsx    # Bill generator view
├── context/
│   └── store.js         # Zustand stores (profile, access, defaults)
├── templates/
│   └── templateConfig.js # Template field definitions
├── utils/
│   ├── accessValidation.js  # Google Sheets email check
│   ├── dateHelpers.js       # Date utilities
│   └── exportUtils.js       # PDF/Image export
└── styles/
    └── index.css        # Global styles
```

## Customizing Templates

The bill templates in `BillPreview.jsx` are **placeholders**. Replace them with your own designs:

1. Open `src/components/BillPreview.jsx`
2. Find the template component you want to customize (e.g., `ElectricityBillTemplate`)
3. Replace the JSX with your own design
4. Update styles in `src/components/BillPreview.css`

Each template receives a `data` prop with all form field values.

## Tech Stack

- **React + Vite** - Fast development and builds
- **React Router** - Client-side routing
- **Zustand** - State management with persistence
- **Motion** - Animations
- **html2pdf.js** - PDF export
- **html2canvas** - Image export

## License

Personal use only.
