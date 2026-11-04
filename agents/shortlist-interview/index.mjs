// Shortlist & Interview: scores candidates per role, assigns a stage, proposes interview slots and a scorecard.
export function score(c, role) {
  const must = role.must.filter(s => c.skills.includes(s)).length;
  const nice = role.nice.filter(s => c.skills.includes(s)).length;
  const exp = c.years >= role.min_years ? 20 : Math.round(20 * c.years / role.min_years);
  return Math.round((must / role.must.length) * 60 + (nice / Math.max(role.nice.length, 1)) * 20 + exp);
}
export const stage = s => (s >= 70 ? 'Shortlist' : s >= 45 ? 'Talent pool' : 'Screen out');
export function run({ records, roles }) {
  const ranked = {};
  let shortlisted = 0;
  const slots = ['Tue 10:00', 'Wed 14:00', 'Thu 11:00'];
  const interviews = [];
  for (const r of roles.open_roles) {
    ranked[r.id] = records.map(c => ({ ...c, score: score(c, r), stage: stage(score(c, r)) })).sort((a, b) => b.score - a.score);
    const short = ranked[r.id].filter(x => x.stage === 'Shortlist');
    shortlisted += short.length;
    short.forEach((c, i) => interviews.push({ role: r.id, candidate: c.name, slot: slots[i % 3], scorecard: ['Role skills', 'Communication', 'Values fit'] }));
  }
  return { ranked, interviews, status: 'ok', task: `Scored ${records.length} candidates for ${roles.open_roles.length} roles: ${shortlisted} shortlisted, ${interviews.length} interview slots proposed` };
}
export const selftest = () => {
  const role = { must: ['a', 'b'], nice: ['c'], min_years: 2 };
  return score({ skills: ['a', 'b', 'c'], years: 5 }, role) === 100 && stage(100) === 'Shortlist' && stage(10) === 'Screen out';
};
