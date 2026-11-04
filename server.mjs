// Backend for the agency. No dependencies. Usage: node server.mjs [--port 8787] [--auto 10]
//   GET  /api/health        liveness
//   GET  /api/state         latest ledger/state
//   GET  /api/events        server-sent events: agent start/done while a cycle runs
//   POST /api/run           run a full cycle now
//   POST /api/candidates    {text}  add a resume ("Name | email | N years ... Skills: a, b"), then run a cycle
//   POST /api/approve       {to, subject, decision: approved|rejected}  human decision on a held outreach email
// It also serves docs/ so http://localhost:8787 shows the dashboard wired to this backend.
import http from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';
import { ROOT, readJSON, writeJSON, logRun } from './shared/lib.mjs';
import { runCycle, EXTRA, APPROVALS } from './cycle.mjs';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const PORT = Number(arg('--port', 8787));
const AUTO_MIN = Number(arg('--auto', 0));
const DOCS = join(ROOT, 'docs');
const MIME = { '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.js': 'text/javascript', '.css': 'text/css' };

const clients = new Set();
let running = false;
const emit = ev => { const line = `data: ${JSON.stringify(ev)}\n\n`; for (const c of clients) c.write(line); };

async function cycle() {
  if (running) return null;
  running = true;
  try { return await runCycle({ delay: 900, emit }); } finally { running = false; }
}
const body = req => new Promise((res, rej) => {
  let s = ''; req.on('data', d => { s += d; if (s.length > 20000) { rej(new Error('too large')); req.destroy(); } });
  req.on('end', () => { try { res(s ? JSON.parse(s) : {}); } catch (e) { rej(e); } });
});
const send = (res, code, obj) => { res.writeHead(code, { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'access-control-allow-private-network': 'true' }); res.end(JSON.stringify(obj)); };

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const p = url.pathname;
  if (req.method === 'OPTIONS') { res.writeHead(204, { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type', 'access-control-allow-methods': 'GET,POST', 'access-control-allow-private-network': 'true' }); return res.end(); }
  try {
    if (p === '/api/health') return send(res, 200, { ok: true, running, auto_minutes: AUTO_MIN });
    if (p === '/api/state') return send(res, 200, readJSON(join(DOCS, 'ledger.json'), {}));
    if (p === '/api/events') {
      res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', 'access-control-allow-origin': '*', connection: 'keep-alive' });
      res.write(`data: ${JSON.stringify({ type: 'hello', running })}\n\n`);
      clients.add(res); req.on('close', () => clients.delete(res)); return;
    }
    if (p === '/api/run' && req.method === 'POST') {
      if (running) return send(res, 409, { error: 'a cycle is already running' });
      return send(res, 200, await cycle());
    }
    if (p === '/api/candidates' && req.method === 'POST') {
      const { text } = await body(req);
      if (typeof text !== 'string' || text.length < 20 || text.length > 1500) return send(res, 400, { error: 'resume text must be 20 to 1500 characters' });
      const extra = readJSON(EXTRA, []);
      if (extra.length >= 50) return send(res, 400, { error: 'candidate limit reached (50)' });
      extra.push({ id: 'X' + (extra.length + 1), text: text.replace(/[\r\n]+/g, ' ').trim() });
      writeJSON(EXTRA, extra);
      if (running) return send(res, 202, { queued: true, note: 'saved; will be included in the next cycle' });
      return send(res, 200, await cycle());
    }
    if (p === '/api/approve' && req.method === 'POST') {
      const { to, subject, decision } = await body(req);
      if (!['approved', 'rejected'].includes(decision) || !to || !subject) return send(res, 400, { error: 'need to, subject, decision (approved|rejected)' });
      const a = readJSON(APPROVALS, {});
      a[to + '|' + subject] = { decision, at: new Date().toISOString() };
      writeJSON(APPROVALS, a);
      logRun('hr-lead', `Human ${decision} outreach to ${to} (${decision === 'approved' ? 'email sending is simulated in this demo' : 'nothing sent'})`, 'ok');
      emit({ type: 'approval', to, decision });
      const st = readJSON(join(DOCS, 'ledger.json'), {});
      st.held_outreach = (st.held_outreach || []).map(h => (h.to === to && h.subject === subject ? { ...h, status: decision } : h));
      st.rows = [...(st.rows || []), { Timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC', 'Agent Name': 'hr-lead', 'Task Performed': `Human ${decision} outreach to ${to}`, 'Output Status': 'ok' }];
      writeJSON(join(DOCS, 'ledger.json'), st);
      return send(res, 200, { ok: true });
    }
    // static files from docs/
    const rel = p === '/' ? 'index.html' : normalize(p).replace(/^([/\\])+/, '');
    const file = join(DOCS, rel);
    if (!file.startsWith(DOCS) || !existsSync(file)) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(readFileSync(file));
  } catch (e) { send(res, 500, { error: String(e.message || e) }); }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`TalentBridge AI backend on http://localhost:${PORT}  (auto-run every ${AUTO_MIN || 'no'} min)`);
  if (AUTO_MIN > 0) setInterval(() => cycle(), AUTO_MIN * 60000);
});
