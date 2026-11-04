// Runs one full cycle from the command line. Usage: node run-all.mjs
import { runCycle } from './cycle.mjs';

const s = await runCycle();
console.log(`Cycle done: ${s.rows.length} ledger rows, ${s.candidates} candidates. Audit: ${s.audit.missing.length} missing, ${s.audit.partial.length} partial.`);
