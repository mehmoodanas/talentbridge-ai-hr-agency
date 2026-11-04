# TalentBridge AI - HR agency run by AI agents

Seven custom AI agents plus an HR Lead (project manager) run a small-business HR workflow: CV intake, sourcing, shortlisting and interviews, job postings, onboarding, hiring analytics and a fairness check.

- Live dashboard (GitHub Pages): see repo "About" link. Reads `docs/ledger.json` every 30 s.
- Ledger sheet (Google Sheets): see `agency.config.json`.
- Agents run on a schedule through `.github/workflows/agents.yml` (every 3 hours) and commit fresh results.

## Run it
```bash
node run-all.mjs   # one full cycle, writes docs/ledger.json, out/ledger.csv, out/brief.txt
node tests.mjs     # 24 checks: self-tests, a full cycle, bias detection, held outreach
```

## Honest notes
- The agents are custom code written for this course project. They are **not** kits from `markfulton/ai-employees` (that repo has no HR kit).
- All candidates and roles are **synthetic sample data** in `data/`.
- Outreach emails are drafted and **held for human approval**; nothing is sent to candidates.
- The agents use rules (regex, scoring, templates), not an LLM, so every run is repeatable and free.
