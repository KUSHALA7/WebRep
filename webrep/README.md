# WebRep

> AI-powered SaaS that audits any business website, generates a tailored proposal, and deploys a context-aware AI agent — in minutes.

---

## What is WebRep?

Most business websites are static brochures. Customers today want to **converse**, not browse. WebRep bridges that gap by:

1. **Scanning** any business website URL
2. **Scoring** it across 6 dimensions (CTA, Social Proof, Clarity, Contact, Trust, SEO)
3. **Writing** an AI-generated proposal specific to the gaps found
4. **Deploying** a context-aware AI agent that knows the business inside out

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| AI / LLM | Groq API — Llama 3.3-70B (analysis & proposal), Llama 3.1-8B (chat) |
| Database & Auth | Supabase (PostgreSQL + Row Level Security) |
| Fonts | Space Grotesk (Google Fonts) |
| Deployment | Vercel |

---

## Features

- **Website Analyzer** — paste any URL, get a scored audit with severity-tagged gaps
- **AI Proposal Generator** — LLM writes a real proposal based on the specific findings (not templates)
- **AI Agent Chat** — context-aware chat agent with full conversation memory
- **Project Dashboard** — save and reload past proposals, restore agent context in one click
- **Dark / Light theme** — persists to localStorage, respects system preference
- **Auth** — email/password + Google OAuth via Supabase

---

## How Responses Are Generated

### 1. Website Analysis (`/api/analyze`)
```
User pastes URL
  → Server fetches HTML (15s timeout)
  → Strips scripts/styles/tags → plain text
  → First 8000 chars sent to Llama 3.3-70B
  → Returns: score/100, scoreBreakdown, strengths[], gaps[] with severity
```

### 2. Proposal Generation (`/api/proposal`)
```
Analysis result + businessName + goal + audience
  → Sent to Llama 3.3-70B with structured prompt
  → Returns: overview, currentState, keyFindings[],
             recommendedImprovements[], nextSteps[], agentUseCases[]
```

### 3. Agent Chat (`/api/agent`)
```
Full conversation history (messages[]) sent on every turn
  → System prompt injected with business context from localStorage
  → Llama 3.1-8B-instant (faster, optimised for chat)
  → Returns: reply
```

---

## Database Schema (Supabase)

```sql
projects   → id, user_id, website_url, business_name, goal, audience, created_at
analyses   → id, project_id, summary, strengths, gaps, score, created_at
proposals  → id, project_id, overview, current_state, key_findings,
             recommended_improvements, next_steps, agent_use_cases, created_at
```

Row Level Security is enabled — users only see their own data.

---

## Local Setup

### 1. Clone and install
```bash
git clone https://github.com/YOUR_USERNAME/webrep.git
cd webrep
npm install
```

### 2. Create `.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key
```

### 3. Create Supabase tables
Run this SQL in your Supabase SQL Editor:

```sql
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  website_url text not null,
  business_name text not null,
  goal text,
  audience text,
  created_at timestamptz default now()
);

create table public.analyses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  summary text,
  strengths jsonb,
  gaps jsonb,
  score integer,
  created_at timestamptz default now()
);

create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  overview text,
  current_state text,
  key_findings jsonb,
  recommended_improvements jsonb,
  next_steps jsonb,
  agent_use_cases jsonb,
  created_at timestamptz default now()
);

alter table public.projects  enable row level security;
alter table public.analyses  enable row level security;
alter table public.proposals enable row level security;

create policy "Users see own projects"  on public.projects  for all using (auth.uid() = user_id);
create policy "Users see own analyses"  on public.analyses  for all using (project_id in (select id from public.projects where user_id = auth.uid()));
create policy "Users see own proposals" on public.proposals for all using (project_id in (select id from public.projects where user_id = auth.uid()));
```

### 4. Run dev server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deployment (Vercel)

1. Push to GitHub
2. Import repo on [vercel.com](https://vercel.com)
3. Add these environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GROQ_API_KEY`
4. Deploy — Vercel auto-detects Next.js, no extra config needed

---

## Project Structure

```
webrep/
├── app/
│   ├── page.tsx          # Landing page
│   ├── analyze/          # Website analyzer
│   ├── proposal/         # Proposal generator
│   ├── agent/            # AI chat agent
│   ├── projects/         # Saved projects
│   ├── auth/             # Sign in / Sign up
│   └── api/
│       ├── analyze/      # Website scrape + LLM audit
│       ├── proposal/     # LLM proposal generation
│       └── agent/        # LLM chat endpoint
├── components/
│   ├── top-nav.tsx       # Navigation with auth state
│   ├── theme-provider.tsx
│   └── theme-toggle.tsx  # Dark / light toggle
├── lib/
│   └── supabaseClient.ts
└── public/
    └── logo.svg
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `GROQ_API_KEY` | Yes | Groq API key for LLM calls |

---

## KPIs (MVP Targets)

| Metric | Target |
|--------|--------|
| Website Analysis Accuracy | ≥ 90% |
| Proposal Generation Time | ≤ 60s |
| Pilot Business Users | 30 |
| Demo → Paid Conversion | ≥ 30% |
| Embed Stability | 95% |
