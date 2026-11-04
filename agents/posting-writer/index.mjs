// Posting Writer: drafts job postings and HELD outreach emails. Nothing is sent.
export function posting(role) {
  return `${role.title}\n\nWhat you will do: own ${role.must.join(', ')} for a growing small business.\nWhat you bring: ${role.min_years}+ years in a similar role; ${role.must.join(', ')}.\nNice to have: ${role.nice.join(', ')}.\nSalary: ${role.salary}.\nWe welcome applicants of every background.`;
}
export function outreach(c, role) {
  return { to: c.email, status: 'held-for-approval', subject: `${role.title} at a TalentBridge client`, body: `Hi ${c.name.split(' ')[0]}, your background in ${c.skills.slice(0, 2).join(' and ')} stood out for our ${role.title} opening. Open to a short call?` };
}
export function run({ roles, ranked }) {
  const postings = roles.open_roles.map(r => ({ role: r.id, text: posting(r) }));
  const held = [];
  for (const r of roles.open_roles) for (const c of (ranked[r.id] || []).filter(x => x.stage === 'Shortlist' && x.email).slice(0, 2)) held.push(outreach(c, r));
  return { postings, held, status: 'ok', task: `Drafted ${postings.length} job postings and ${held.length} held outreach emails` };
}
export const selftest = () => posting({ title: 'T', must: ['a'], nice: ['b'], min_years: 2, salary: 's' }).includes('2+ years')
  && outreach({ name: 'A B', email: 'a@b.c', skills: ['x', 'y'] }, { title: 'T' }).status === 'held-for-approval';
