# IT Management System

A full-stack internal IT management portal with three modules:
- **IT Helpdesk** — Employees raise support tickets; IT staff triage and resolve them
- **Asset & Equipment Tracker** — Track devices, peripherals, and who they're assigned to
- **Software & License Tracker** — Manage subscriptions, costs, and renewal dates

**Stack:** Next.js 14 (App Router) · Supabase (Auth + Database) · Tailwind CSS · Vercel

---

## 🚀 Setup Guide

### Step 1 — Create your Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once created, go to **SQL Editor** and run the contents of:
   ```
   supabase/migrations/001_initial_schema.sql
   ```
   This creates all tables, RLS policies, and triggers.

3. In **Authentication → Providers**, make sure **Email** is enabled.

4. Copy your credentials from **Project Settings → API**:
   - `Project URL`
   - `anon / public` key

### Step 2 — Set up the project locally

```bash
# Clone your repo (after pushing to GitHub)
git clone https://github.com/YOUR_USERNAME/it-system.git
cd it-system

# Install dependencies
npm install

# Create your env file
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 3 — Run locally

```bash
npm run dev
```

Visit `http://localhost:3000` — you'll be redirected to the login page.

### Step 4 — Create your first admin account

1. Sign up at the login page with your email
2. Go to Supabase **Table Editor → profiles**
3. Find your row and change `role` from `employee` to `admin`

From now on, you can manage roles from the **Admin** panel in the app.

### Step 5 — Deploy to Vercel

1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your GitHub repo

3. Add environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. Click **Deploy** ✅

---

## 👥 User Roles

| Role | Helpdesk | Assets | Licenses | Admin |
|------|----------|--------|----------|-------|
| `employee` | Submit & view own tickets | ❌ | ❌ | ❌ |
| `it_staff` | Manage all tickets | ✅ Full | ✅ Full | ❌ |
| `admin` | Manage all tickets | ✅ Full | ✅ Full | ✅ |

New sign-ups start as `employee`. Promote users in the **Admin** panel.

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (app)/              # Protected routes (require login)
│   │   ├── dashboard/      # Overview & stats
│   │   ├── helpdesk/       # Ticket list, detail, new ticket
│   │   ├── assets/         # Asset tracker
│   │   ├── licenses/       # License tracker
│   │   └── admin/          # User management (admin only)
│   ├── auth/
│   │   └── login/          # Login & signup
│   └── globals.css
├── components/
│   └── layout/
│       └── Sidebar.tsx
├── lib/
│   └── supabase/
│       ├── client.ts       # Browser client
│       └── server.ts       # Server client
├── middleware.ts            # Auth route protection
└── types/index.ts           # TypeScript types
```

---

## 🔧 Extending the App

### Add email notifications on ticket creation
Use Supabase Edge Functions + SMTP/Resend to send emails when tickets are created or updated.

### Add file attachments to tickets
Enable Supabase Storage, create a `ticket-attachments` bucket, and add file upload to the ticket form.

### Add asset QR codes
Use a library like `qrcode` to generate and print QR codes for each asset tag.
