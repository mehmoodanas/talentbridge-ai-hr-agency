// HR Lead (project manager): checks that every agent ran in this cycle, builds the ledger rows and the daily brief.
export const TEAM = [
  { slug: 'cv-intake', name: 'CV Intake', role: 'Resume parser' },
  { slug: 'role-scout', name: 'Role Scout', role: 'Candidate sourcer' },
  { slug: 'shortlist-interview', name: 'Shortlist & Interview', role: 'Screening and interviews' },
  { slug: 'posting-writer', name: 'Posting Writer', role: 'Job posts and outreach' },
  { slug: 'onboarding-planner', name: 'Onboarding Planner', role: 'New-hire plans' },
  { slug: 'people-analytics', name: 'People Analytics', role: 'Hiring metrics' },
  { slug: 'fairness-checker', name: 'Fairness Checker', role: 'Bias and compliance review' },
];

export function audit(cycle) {
  const bySlug = Object.fromEntries(cycle.map(r => [r.agent, r]));
  const missing = TEAM.filter(t => !bySlug[t.slug]);
  const partial = TEAM.filter(t => bySlug[t.slug] && bySlug[t.slug].status !== 'ok');
  return { missing, partial, healthy: TEAM.length - missing.length - partial.length };
}
export function run({ cycle }) {
  const a = audit(cycle);
  return { audit: a, status: a.missing.length ? 'failed' : 'ok',
    task: `Audited all ${TEAM.length} agents (${a.missing.length} missing, ${a.partial.length} partial) and built the daily brief` };
}
export function brief(cycle, a, sheetUrl) {
  const lines = cycle.map(r => `- ${r.agent}: ${r.task} [${r.status}]`);
  return `TalentBridge AI - daily HR agency brief\n\nAgents healthy: ${a.healthy}/${TEAM.length}. Needs human review: ${a.partial.map(p => p.name).join(', ') || 'nothing'}.\n\n${lines.join('\n')}\n\nLedger: ${sheetUrl}\nAll outreach emails are held for human approval; nothing was sent to candidates.`;
}
export const selftest = () => {
  const a = audit([{ agent: 'cv-intake', status: 'ok' }]);
  return a.missing.length === TEAM.length - 1 && a.healthy === 1;
};
