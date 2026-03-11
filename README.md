# Montera — Crypto Investment Platform

A professional crypto investment platform built with React, Vite, TypeScript, Supabase, and Tailwind CSS.

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS + shadcn/ui
- **Backend:** Supabase (Auth, Database, Storage, Realtime)
- **State:** TanStack React Query
- **Animations:** Framer Motion
- **Routing:** React Router DOM v6

## Features

- 📊 Real-time portfolio dashboard with live chart
- 💰 Investment plans with auto-compounding returns
- 🔐 Bank-grade security with KYC verification
- 🔔 Real-time notifications
- 💳 Deposit & withdrawal flows
- 👛 Wallet connect (MetaMask, Phantom, Coinbase, Trust Wallet)
- 🎁 Bonus & referral system
- 🛡️ Admin panel (users, KYC review, bonus management, analytics)
- 📱 Fully responsive (mobile + desktop)

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/Majek11/crypto-montera.git
cd crypto-montera
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Fill in your Supabase credentials in `.env`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

### 4. Run locally

```bash
npm run dev
```

### 5. Build for production

```bash
npm run build
```

## Deployment

Deployed on **Vercel**. Every push to `main` triggers a new deployment automatically.

Make sure the following environment variables are set in your Vercel project settings:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

## Folder Structure

```
src/
├── components/       # Reusable UI components
│   ├── dashboard/    # Dashboard widgets
│   ├── features/     # Landing page sections
│   ├── layout/       # App & Admin layouts
│   ├── security/     # 2FA, email verification
│   └── wallet/       # Wallet connect
├── contexts/         # React context (Auth)
├── hooks/            # Custom React Query hooks
├── integrations/     # Supabase client & generated types
├── lib/              # Utilities, constants, audit logger
├── pages/            # Page components
│   └── admin/        # Admin-only pages
└── types/            # Shared TypeScript interfaces
```

## License

MIT
