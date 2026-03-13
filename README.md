# SpeedPulse — Network Speed Test

A clean, modern internet speed test with built-in ad monetization. Built with React + Vite, Netlify Functions, and Supabase.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to the **SQL Editor** and paste the contents of `supabase-schema.sql` — run it
3. Copy your project URL and anon key from **Settings → API**

### 3. Configure Environment

```bash
cp .env.example .env
```

Fill in your `.env`:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
NOTIFY_WEBHOOK=https://your-webhook-url (optional)
```

### 4. Run Locally

```bash
npm run dev
```

For full Netlify Functions support locally:

```bash
npx netlify-cli dev
```

### 5. Deploy to Netlify

1. Push to GitHub
2. Connect the repo in [Netlify](https://app.netlify.com)
3. Set environment variables in **Site Settings → Environment**
4. Deploys automatically on push

## Adding Your First Ad

Insert a row directly in the Supabase `ads` table:

| Column        | Value                          |
|---------------|--------------------------------|
| business_name | Acme Corp                      |
| headline      | Speed up your internet today   |
| description   | Professional network solutions |
| cta_text      | Learn More                     |
| cta_url       | https://example.com            |
| placement     | top                            |
| status        | approved                       |

## Tech Stack

- **Frontend:** React 18 + Vite
- **Backend:** Netlify Functions (serverless)
- **Database:** Supabase (PostgreSQL)
- **Speed Test:** Cloudflare speed endpoints + upload timing
