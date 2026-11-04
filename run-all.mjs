// Runs one full cycle: every agent works on the sample data, the HR Lead audits, and the ledger + dashboard data are written.
// Usage: node run-all.mjs
import { join } from 'node:path';
import { ROOT, readJSON, writeJSON, logRun, now } from './shared/lib.mjs';
import { writeFileSync } from 'node:fs';
import * as intake from './agents/cv-intake/index.mjs';
import * as scout from './agents/role-scout/index.mjs';
import * as ranker from './agents/shortlist-interview/index.mjs';
import * as writer from './agents/posting-writer/index.mjs';
import * as onboard from './agents/onboarding-planner/index.mjs';
import * as analytics from './agents/people-analytics/index.mjs';
import * as fairness from './agents/fairness-checker/index.mjs';
import * as lead from './agents/hr-lead/index.mjs';

const cfg = readJSON(join(ROOT, 'agency.config.json'));
const candidates = readJSON(join(ROOT, 'data', 'candidates.json'));
const roles = readJSON(join(ROOT, 'data', 'roles.json'));
const cycle = [];
const step = (slug, out) => { const r = logRun(slug, out.task, out.status); cycle.push(r); return out; };

const a = step('cv-intake', intake.run({ candidates }));
step('role-scout', scout.run({ roles }));
const b = step('shortlist-interview', ranker.run({ records: a.records, roles }));
const c = step('posting-writer', writer.run({ roles, ranked: b.ranked }));
step('onboarding-planner', onboard.run({ roles }));
const d = step('people-analytics', analytics.run({ ranked: b.ranked }));
const e = step('fairness-checker', fairness.run({ roles, postings: c.postings }));
const l = lead.run({ cycle });
cycle.push(logRun('hr-lead', l.task, l.status));

const history = readJSON(join(ROOT, 'docs', 'ledger.json'), { rows: [] }).rows;
const rows = [...history, ...cycle.map(r => ({ Timestamp: r.ts, 'Agent Name': r.agent, 'Task Performed': r.task, 'Output Status': r.status }))].slice(-300);
const state = {
  agency: cfg.agency, updated: now(), sheet_url: cfg.ledger.sheet_url,
  team: [...lead.TEAM, { slug: 'hr-lead', name: 'HR Lead', role: 'Project manager' }],
  funnel: d.funnel, interviews: b.interviews, held_outreach: c.held, findings: e.findings, onboarding: onboard.run({ roles }).plans,
  audit: l.audit, rows,
};
writeJSON(join(ROOT, 'docs', 'ledger.json'), state);
writeJSON(join(ROOT, 'out', 'ledger.json'), state);
const csv = ['Timestamp,Agent Name,Task Performed,Output Status', ...rows.map(r => [r.Timestamp, r['Agent Name'], r['Task Performed'], r['Output Status']].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))];
writeFileSync(join(ROOT, 'out', 'ledger.csv'), csv.join('\n'));
writeFileSync(join(ROOT, 'out', 'brief.txt'), lead.brief(cycle, l.audit, cfg.ledger.sheet_url));
console.log(`Cycle done: ${cycle.length} agent runs, ${rows.length} ledger rows. ${l.task}`);
