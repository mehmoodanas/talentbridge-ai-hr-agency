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
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
