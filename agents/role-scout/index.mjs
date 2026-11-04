// Role Scout: builds boolean sourcing searches for each open role.
export function search(role) {
  const must = role.must.map(s => `"${s}"`).join(' AND ');
  const nice = role.nice.map(s => `"${s}"`).join(' OR ');
  return { role: role.id, title: role.title, query: `(${must}) AND (${nice})`, sites: ['linkedin.com/in', 'xing.com/profile'] };
}
export function run({ roles }) {
  const plans = roles.open_roles.map(search);
  return { plans, status: 'ok', task: `Built sourcing searches for ${plans.length} open roles` };
}
export const selftest = () => search({ id: 'X', title: 't', must: ['a', 'b'], nice: ['c'] }).query === '("a" AND "b") AND ("c")';
