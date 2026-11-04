// Onboarding Planner: 30/60/90-day plan for each new hire.
export function plan(h) {
  return { name: h.name, role: h.role, start: h.start, days30: ['Accounts, equipment, policy sign-off', 'Meet the team', `Shadow current ${h.role} work`], days60: ['Own one process end to end', 'First feedback check-in'], days90: ['Own goals for the year', '90-day review with manager'] };
}
export function run({ roles }) {
  const plans = roles.new_hires.map(plan);
  return { plans, status: 'ok', task: `Generated 30/60/90-day onboarding plans for ${plans.length} new hire(s)` };
}
export const selftest = () => { const p = plan({ name: 'A', role: 'R', start: 'x' }); return p.days30.length === 3 && p.days90.length === 2; };
