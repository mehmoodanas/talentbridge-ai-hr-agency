// One full agency cycle. Used by run-all.mjs (CLI, GitHub Action) and server.mjs (backend).
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';
import { ROOT, readJSON, writeJSON, logRun, now } from './shared/lib.mjs';
import * as intake from './agents/cv-intake/index.mjs';
import * as scout from './agents/role-scout/index.mjs';
import * as ranker from './agents/shortlist-interview/index.mjs';
import * as writer from './agents/posting-writer/index.mjs';
import * as onboard from './agents/onboarding-planner/index.mjs';
import * as analytics from './agents/people-analytics/index.mjs';
import * as fairness from './agents/fairness-checker/index.mjs';
import * as lead from './agents/hr-lead/index.mjs';

const sleep = ms => new Promise(r => setTimeout(r, ms));
export const EXTRA = join(ROOT, 'out', 'extra-candidates.json');
export const APPROVALS = join(ROOT, 'out', 'approvals.json');

export async function runCycle({ delay = 0, emit = () => {} } = {}) {
  const cfg = readJSON(join(ROOT, 'agency.config.json'));
  const candidates = [...readJSON(join(ROOT, 'data', 'candidates.json')), ...readJSON(EXTRA, [])];
  const roles = readJSON(join(ROOT, 'data', 'roles.json'));
  const approvals = readJSON(APPROVALS, {});
  const cycle = [];
  emit({ type: 'cycle-start', at: now() });

  const step = async (slug, fn) => {
    emit({ type: 'start', agent: slug });
    if (delay) await sleep(delay);
    const out = fn();
    const rec = logRun(slug, out.task, out.status);
    cycle.push(rec);
    emit({ type: 'done', agent: slug, task: out.task, status: out.status });
    return out;
  };

  const a = await step('cv-intake', () => intake.run({ candidates }));
  await step('role-scout', () => scout.run({ roles }));
  const b = await step('shortlist-interview', () => ranker.run({ records: a.records, roles }));
  const c = await step('posting-writer', () => writer.run({ roles, ranked: b.ranked }));
  const ob = await step('onboarding-planner', () => onboard.run({ roles }));
  const d = await step('people-analytics', () => analytics.run({ ranked: b.ranked }));
  const e = await step('fairness-checker', () => fairness.run({ roles, postings: c.postings }));
  const l = await step('hr-lead', () => lead.run({ cycle }));

  const held = c.held.map(h => ({ ...h, status: approvals[h.to + '|' + h.subject]?.decision ?? h.status }));
  const history = readJSON(join(ROOT, 'docs', 'ledger.json'), { rows: [] }).rows;
  const rows = [...history, ...cycle.map(r => ({ Timestamp: r.ts, 'Agent Name': r.agent, 'Task Performed': r.task, 'Output Status': r.status }))].slice(-300);
  const state = {
    agency: cfg.agency, updated: now(), sheet_url: cfg.ledger.sheet_url,
    team: [...lead.TEAM, { slug: 'hr-lead', name: 'HR Lead', role: 'Project manager' }],
    candidates: a.records.length, funnel: d.funnel, interviews: b.interviews, held_outreach: held, findings: e.findings,
    onboarding: ob.plans, audit: l.audit, rows,
  };
  writeJSON(join(ROOT, 'docs', 'ledger.json'), state);
  writeJSON(join(ROOT, 'out', 'ledger.json'), state);
  const csv = ['Timestamp,Agent Name,Task Performed,Output Status', ...rows.map(r => [r.Timestamp, r['Agent Name'], r['Task Performed'], r['Output Status']].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))];
  writeFileSync(join(ROOT, 'out', 'ledger.csv'), csv.join('\n'));
  writeFileSync(join(ROOT, 'out', 'brief.txt'), lead.brief(cycle, l.audit, cfg.ledger.sheet_url));
  emit({ type: 'cycle-done', at: now(), rows: rows.length });
  return state;
}
