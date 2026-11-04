// Test suite. Run: node tests.mjs
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT } from './shared/lib.mjs';
import { TEAM } from './agents/hr-lead/index.mjs';

let pass = 0, fail = 0;
const t = (n, ok, x = '') => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? ' - ' + x : ''}`); };

for (const m of [...TEAM, { slug: 'hr-lead' }]) {
  const mod = await import(`./agents/${m.slug}/index.mjs`);
  t(`${m.slug}: exports run()`, typeof mod.run === 'function');
  t(`${m.slug}: self-test`, mod.selftest() === true);
}
execFileSync('node', ['run-all.mjs'], { cwd: ROOT, stdio: 'pipe' });
const s = JSON.parse(readFileSync(join(ROOT, 'docs', 'ledger.json'), 'utf8'));
t('cycle logged 8 agents', s.rows.slice(-8).length === 8);
t('last cycle rows have 4 filled fields', s.rows.slice(-8).every(r => Object.values(r).filter(Boolean).length === 4));
t('HR Lead found no missing agents', s.audit.missing.length === 0);
t('fairness checker caught the biased legacy posting', s.findings.some(f => f.id === 'L1' && f.flags.length >= 3));
t('outreach emails are held, not sent', s.held_outreach.every(h => h.status === 'held-for-approval'));
t('candidate without email is flagged', s.rows.slice(-8)[0]['Task Performed'].includes('1 missing an email'));
t('shortlist count is 2', s.funnel.shortlist === 2, `got ${s.funnel.shortlist}`);
t('dashboard exists', existsSync(join(ROOT, 'docs', 'index.html')));
// ---- backend API ----
import { spawn } from 'node:child_process';
import { writeJSON } from './shared/lib.mjs';
import { EXTRA, APPROVALS } from './cycle.mjs';
const PORT = 8799, base = `http://127.0.0.1:${PORT}`;
const srv = spawn('node', ['server.mjs', '--port', String(PORT)], { cwd: ROOT, stdio: 'ignore' });
const post = (u, b) => fetch(base + u, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) });
try {
  let up = false;
  for (let i = 0; i < 30 && !up; i++) { try { up = (await fetch(base + '/api/health')).ok; } catch { await new Promise(r => setTimeout(r, 200)); } }
  t('backend: health endpoint', up);
  const before = (await (await fetch(base + '/api/state')).json()).funnel.shortlist;
  t('backend: rejects a too-short resume', (await post('/api/candidates', { text: 'hi' })).status === 400);
  const r = await post('/api/candidates', { text: 'Test Person | test.person@example.com | 7 years experience in recruiting. Skills: recruiting, sourcing, communication, negotiation, analytics. MSc HR.' });
  const st = await r.json();
  t('backend: new resume runs a full cycle', r.status === 200 && st.candidates === 7, `candidates ${st.candidates}`);
  t('backend: new strong candidate gets shortlisted', st.funnel.shortlist > before, `${before} -> ${st.funnel.shortlist}`);
  const h = st.held_outreach[0];
  t('backend: approve rejects a bad decision', (await post('/api/approve', { to: h.to, subject: h.subject, decision: 'maybe' })).status === 400);
  t('backend: human approval is recorded', (await post('/api/approve', { to: h.to, subject: h.subject, decision: 'approved' })).ok);
  const after = await (await fetch(base + '/api/state')).json();
  t('backend: approval shows in state and ledger', after.held_outreach.some(x => x.to === h.to && x.status === 'approved') && after.rows.at(-1)['Task Performed'].includes('approved'));
} finally {
  srv.kill();
  writeJSON(EXTRA, []); writeJSON(APPROVALS, {});
  execFileSync('node', ['run-all.mjs'], { cwd: ROOT, stdio: 'pipe' });
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
