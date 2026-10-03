// Proxies the Shulker API so the secret key never reaches the browser.
// Needs env var SHULKER_API_KEY (Netlify > Project configuration > Environment variables).
// The live API rejects action "server_status" for some accounts, so this tries
// server_status, then server_stats, then the server list, and reports why each failed.
exports.handler = async () => {
  const json = (o, cache) => ({ statusCode: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=' + (cache ? 30 : 15) }, body: JSON.stringify(o) });
  const key = (process.env.SHULKER_API_KEY || '').trim();
  let cfg = {};
  try { cfg = require('./config.json'); } catch (e) {}
  const name = String(cfg.server_name || '').trim(), node = String(cfg.node || '').trim();
  if (!key || !name || !node) {
    return json({ configured: false, missing: [!key && 'API key variable', !name && 'server name', !node && 'node'].filter(Boolean) });
  }
  const call = async params => {
    const r = await fetch('https://shulker.in/api/v2/?' + new URLSearchParams({ ...params, api_key: key }), { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(3500) });
    let j = {};
    try { j = JSON.parse(await r.text()); } catch (e) {}
    return { ok: r.ok && j.success, status: r.status, j };
  };
  const why = (label, x) => `${label}: HTTP ${x.status} ${x.j.message || x.j.error || (Object.keys(x.j).length ? '' : 'non-JSON reply')}`.trim();
  const done = (data, via) => {
    data = { ...data };
    delete data.server_ip; // keep the server address private
    return json({ configured: true, online: /running/i.test(data.server_status || ''), via, data }, true);
  };
  const t0 = Date.now(), fails = [];
  const base = { req: 'minecraft', server_name: name, node };

  for (const action of ['server_status', 'server_stats']) {
    if (Date.now() - t0 > 6500) break;
    try {
      const x = await call({ ...base, action });
      const d = x.j.data || x.j.stats;
      if (x.ok && d && typeof d === 'object') return done(d, action);
      fails.push(why(action, x));
    } catch (e) { fails.push(`${action}: ${e.name || 'error'}`); }
  }

  if (Date.now() - t0 < 6500) {
    try {
      const x = await call({ req: 'servers' });
      const s = x.ok && (x.j.servers || []).find(v => String(v.server_name).toLowerCase() === name.toLowerCase() && (!v.server_node || String(v.server_node).toLowerCase() === node.toLowerCase()));
      if (s) {
        return done({
          server_status: `${s.server_name} (${s.server_status})`, region: s.server_region, version: s.server_version,
          cpu: s.server_cpu, ram: s.server_ram, disk: s.server_disk, node: s.server_node, created: s.server_creation_time,
        }, 'servers list');
      }
      fails.push(x.ok ? 'servers: no server with that name and node' : why('servers', x));
    } catch (e) { fails.push(`servers: ${e.name || 'error'}`); }
  }
  return json({ configured: true, error: true, reason: fails.join(' | ').slice(0, 400) });
};
