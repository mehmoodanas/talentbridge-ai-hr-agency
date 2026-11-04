// People Analytics: hiring funnel numbers and the biggest bottleneck.
export function funnel(ranked) {
  const all = Object.values(ranked).flat();
  const c = s => all.filter(x => x.stage === s).length;
  const f = { screened: all.length, shortlist: c('Shortlist'), pool: c('Talent pool'), out: c('Screen out') };
  const rate = f.screened ? f.shortlist / f.screened : 0;
  return { ...f, shortlist_rate: Math.round(rate * 100), bottleneck: rate < 0.25 ? 'Few candidates reach the shortlist: widen sourcing' : 'none' };
}
export function run({ ranked }) {
  const f = funnel(ranked);
  return { funnel: f, status: 'ok', task: `Computed funnel metrics: ${f.screened} scores, ${f.shortlist} shortlisted (${f.shortlist_rate}%), bottleneck ${f.bottleneck === 'none' ? 'none' : 'flagged'}` };
}
export const selftest = () => funnel({ R: [{ stage: 'Shortlist' }, { stage: 'Screen out' }] }).shortlist_rate === 50;
