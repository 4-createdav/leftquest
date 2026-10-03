// Proxies the Shulker API so the secret key never reaches the browser.
// Needs env var SHULKER_API_KEY (Netlify > Project configuration > Environment variables).
exports.handler = async () => {
  const h = { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=30' };
  const out = o => ({ statusCode: 200, headers: h, body: JSON.stringify(o) });
  const key = process.env.SHULKER_API_KEY;
  let cfg = {};
  try { cfg = require('./config.json'); } catch (e) {}
  if (!key || !cfg.server_name || !cfg.node) return out({ configured: false });
  const u = new URL('https://shulker.in/api/v2/');
  u.search = new URLSearchParams({ req: 'minecraft', action: 'server_status', server_name: cfg.server_name, node: cfg.node });
  try {
    const r = await fetch(u, { headers: { 'X-API-Key': key }, signal: AbortSignal.timeout(8000) });
    const j = await r.json(), d = j.data;
    if (!r.ok || !j.success || !d) return out({ configured: true, error: true });
    const data = { ...d };
    delete data.server_ip; // keep the server address private
    return out({ configured: true, online: /running/i.test(d.server_status || ''), data });
  } catch (e) {
    return out({ configured: true, error: true });
  }
};
