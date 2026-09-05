# AGENTS.md — Project Rules for Antigravity

Place this file at the ROOT of your Antigravity workspace (same level as package.json).
Antigravity reads this automatically before every task — you do not need to paste it into chat.

## What this project is
A one-on-one session booking marketplace ("SessionBook"). Creators list bookable sessions,
clients pay to book a slot, the platform takes a 4% commission on every booking, the rest
goes to the creator. Full functional spec lives in `PROJECT_SPEC.md` in this same folder —
read it before starting any phase.

## Non-negotiable rules

### 1. Git — commit after every discrete change
This is the most important rule in this file. Do not skip it, do not batch it.
- Run `git init` and make an initial commit before writing any feature code, if a repo doesn't exist yet.
- After finishing **any** discrete unit of work — one component, one API route, one bug fix,
  one schema change, one config tweak — immediately run:
  ```
  git add -A
  git commit -m "<type>: <short description>"
  ```
- Use conventional commit types: `feat`, `fix`, `chore`, `refactor`, `style`, `docs`, `test`.
- One logical change per commit. Never bundle an unrelated fix into a feature commit.
- Never end a task, a phase, or a session with an uncommitted (dirty) working tree.
- Write commit messages a human will actually understand later, e.g.
  `feat: add weekly availability rules CRUD API` — not `feat: update files`.
- Do not push to any remote unless explicitly asked — local commits only, by default.

### 2. Secrets
- Never hardcode API keys, DB URLs, or the Razorpay key secret / webhook secret in source files.
- Everything sensitive goes in `.env.local`, referenced via `process.env.*`, and `.env.local`
  must be in `.gitignore` from the very first commit. Maintain a `.env.example` with empty
  placeholders for every variable so the project is reproducible.

### 3. Payments are security-critical
- Every payment webhook handler MUST verify the Razorpay signature before trusting the payload.
- Never trust amount/status fields sent from the browser. Always recompute price server-side
  from the SessionType record, never from client input.
- All money fields stored in the smallest currency unit (paise, integer) — never floats.

### 4. Scope discipline
- Build in the phases defined in `PROJECT_SPEC.md`, in order. Do not jump ahead to Phase 5
  before Phase 1–4 are working and committed.
- At the end of each phase, do a short self-review against that phase's checklist before
  moving on, and report what was completed.

### 5. Code standards
- TypeScript everywhere, strict mode on.
- Validate all external input (form submissions, API bodies, webhook payloads) with Zod.
- All dates/times stored in UTC in the database; convert to the relevant timezone only at
  the display/input layer.
- Prefer small, composable files over large ones. One React component per file.
