// Fairness Checker: flags biased wording and missing pay info in postings. Review only, never edits.
const BAD = [/\byoung\b/i, /\brockstar\b/i, /\bnative\b.*speaker/i, /\bhe must\b/i, /\b24\/7\b/i, /\benergetic\b/i];
export function check(text) { return BAD.filter(r => r.test(text)).map(r => r.source); }
export function run({ roles, postings }) {
  const items = [...roles.legacy_postings.map(p => ({ id: p.id, text: p.text })), ...postings.map(p => ({ id: p.role, text: p.text }))];
  const findings = items.map(i => ({ id: i.id, flags: check(i.text), salary: /salary|chf/i.test(i.text) })).filter(f => f.flags.length || !f.salary);
  const issues = findings.reduce((n, f) => n + f.flags.length + (f.salary ? 0 : 1), 0);
  return { findings, status: issues ? 'partial' : 'ok', task: `Audited ${items.length} postings, found ${issues} issue(s) for human review` };
}
export const selftest = () => check('young rockstar').length === 2 && check('We welcome everyone').length === 0;
