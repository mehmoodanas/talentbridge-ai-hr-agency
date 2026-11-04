// Shared helpers: JSON IO and the append-only run log every agent writes to.
import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const readJSON = (p, fb) => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : fb);
export const writeJSON = (p, v) => { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, JSON.stringify(v, null, 2)); };
export const now = () => new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

const RUNLOG = join(ROOT, 'out', 'runlog.jsonl');
export function logRun(agent, task, status, detail = {}) {
  mkdirSync(dirname(RUNLOG), { recursive: true });
  const rec = { ts: now(), agent, task, status, ...detail };
  appendFileSync(RUNLOG, JSON.stringify(rec) + '\n');
  return rec;
}
export function readRunlog() {
  return existsSync(RUNLOG) ? readFileSync(RUNLOG, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)) : [];
}
export const SKILLS = ['python', 'sql', 'excel', 'recruiting', 'payroll', 'onboarding', 'communication', 'react', 'javascript', 'analytics', 'training', 'compliance', 'negotiation', 'sourcing'];
