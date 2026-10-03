// Proxies the Shulker API so the secret key never reaches the browser.
// Needs env var SHULKER_API_KEY (Netlify > Project configuration > Environment variables).
exports.handler = async () => {
  const json = (o, cache) => ({ statusCode: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': cache ? 'public, max-age=30' : 'no-store' }, body: JSON.stringify(o) });
  const key = (process.env.SHULKER_API_KEY || '').trim();
  let cfg = {};
  try { cfg = require('./config.json'); } catch (e) {}
  const name = String(cfg.server_name || '').trim(), node = String(cfg.node || '').trim();
  if (!key || !name || !node) {
    return json({ configured: false, missing: [!key && 'API key variable', !name && 'server name', !node && 'node'].filter(Boolean) });
  }
  const u = new URL('https://shulker.in/api/v2/');
  u.search = new URLSearchParams({ req: 'minecraft', action: 'server_status', server_name: name, node, api_key: key });
  try {
    const r = await fetch(u, { headers: { 'X-API-Key': key, Accept: 'application/json' }, signal: AbortSignal.timeout(8000) });
    const text = await r.text();
    let j = {};
    try { j = JSON.parse(text); } catch (e) {}
    const d = j.data;
    if (!r.ok || !j.success || !d) {
      const why = ['HTTP ' + r.status, j.message || j.error || (Object.keys(j).length ? '' : 'non-JSON reply (possibly blocked)')].filter(Boolean).join(' - ');
      return json({ configured: true, error: true, reason: why.slice(0, 160) });
    }
    const data = { ...d };
    delete data.server_ip; // keep the server address private
    return json({ configured: true, online: /running/i.test(d.server_status || ''), data }, true);
  } catch (e) {
    return json({ configured: true, error: true, reason: 'could not reach Shulker (' + (e.name || 'error') + ')' });
  }
};
