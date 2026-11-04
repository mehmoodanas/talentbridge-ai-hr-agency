# TalentBridge AI - HR agency run by AI agents

Seven custom AI agents plus an HR Lead (project manager) run a small-business HR workflow: CV intake, sourcing, shortlisting and interviews, job postings, onboarding, hiring analytics and a fairness check.

- Live dashboard (GitHub Pages): see repo "About" link. Reads `docs/ledger.json` every 30 s.
- Ledger sheet (Google Sheets): see `agency.config.json`.
- Agents run on a schedule through `.github/workflows/agents.yml` (every 3 hours) and commit fresh results.

## Backend (the agency runs for real)
```bash
node server.mjs --auto 30     # http://localhost:8787, runs a cycle every 30 minutes
```
API: `GET /api/state`, `GET /api/events` (live agent events), `POST /api/run`, `POST /api/candidates` (add a resume), `POST /api/approve` (human approves or rejects held outreach).
Open http://localhost:8787 for the 3D office wired to the backend: press "Run a full cycle" and watch each agent work, add a resume, approve or reject outreach.
The GitHub Pages copy shows the same 3D office in static mode from `docs/ledger.json`.

## Run it
```bash
node run-all.mjs   # one full cycle, writes docs/ledger.json, out/ledger.csv, out/brief.txt
node tests.mjs     # 31 checks: self-tests, a full cycle, bias detection, held outreach, backend API
```

## Honest notes
- The agents are custom code written for this course project. They are **not** kits from `markfulton/ai-employees` (that repo has no HR kit).
- All candidates and roles are **synthetic sample data** in `data/`.
- Outreach emails are drafted and **held for human approval**; nothing is sent to candidates.
- The agents use rules (regex, scoring, templates), not an LLM, so every run is repeatable and free.
