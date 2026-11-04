// CV Intake: turns raw resume text into structured candidate records.
import { SKILLS } from '../../shared/lib.mjs';

export function parse(c) {
  const t = c.text;
  const email = (t.match(/[\w.+-]+@[\w-]+\.[\w.]+/) || [null])[0];
  const years = Number((t.match(/(\d+)\s+years?/i) || [0, 0])[1]);
  const lower = t.toLowerCase();
  const skills = SKILLS.filter(s => lower.includes(s));
  const edu = (t.match(/(MSc|BSc|MA|BA|Diploma)[^.|]*/) || [''])[0].trim();
  return { id: c.id, name: t.split('|')[0].trim(), email, years, skills, education: edu };
}
export function run({ candidates }) {
  const records = candidates.map(parse);
  const incomplete = records.filter(r => !r.email).length;
  return { records, status: incomplete ? 'partial' : 'ok',
    task: `Parsed ${records.length} resumes into candidate records (${incomplete} missing an email)` };
}
export const selftest = () => {
  const r = parse({ id: 'T', text: 'Ann Lee | ann@x.org | 5 years experience. Skills: python, sql. BSc Maths.' });
  return r.email === 'ann@x.org' && r.years === 5 && r.skills.includes('python') && r.education.startsWith('BSc');
};
