const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---- routing: #/home, #/games, #/games/minecraft ---- */
function route() {
  const [, page, sub] = location.hash.split('/');
  const p = page === 'games' ? 'games' : 'home', s = sub === 'minecraft' ? 'minecraft' : 'all';
  $$('.page').forEach(e => e.classList.toggle('show', e.id === p));
  $$('[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === p));
  $$('.tab[data-sub]').forEach(t => t.classList.toggle('active', t.dataset.sub === s));
  $$('.panel').forEach(e => e.classList.toggle('show', e.id === 'panel-' + s));
  scrollTo({ top: 0 });
  if (p === 'games') loadStatus();
}
addEventListener('hashchange', route);

/* ---- rising pixels ---- */
for (let i = 0; i < 20; i++) {
  const d = document.createElement('i'), n = 4 + Math.random() * 8;
  d.className = 'px';
  d.style.cssText = `left:${Math.random() * 100}%;width:${n}px;height:${n}px;animation-duration:${9 + Math.random() * 12}s;animation-delay:-${Math.random() * 15}s;background:${Math.random() > .8 ? 'var(--gold)' : 'var(--grass)'}`;
  document.body.appendChild(d);
}

/* ---- live Shulker status: every field the API returns ---- */
const LABELS = { server_status: 'Server', uptime: 'Uptime', cpu_usage: 'CPU usage', ram_usage: 'RAM usage', disk_usage: 'Disk usage',
  region: 'Region', total_ram: 'Total RAM', total_disk: 'Total disk', shutdown_timer: 'Shutdown timer' };
const BARS = ['cpu_usage', 'ram_usage', 'disk_usage'];
const nice = k => k.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase());

function pct(k, v) {
  if (k === 'cpu_usage') { const n = parseFloat(v); return isNaN(n) ? null : Math.min(100, n); }
  const m = String(v).match(/([\d.]+)\s*\/\s*([\d.]+)/);
  return m && +m[2] ? Math.min(100, m[1] / m[2] * 100) : null;
}

const setBox = t => { const b = $('#box-status'); if (b) b.innerHTML = t; };

function renderStatus(r) {
  const el = $('#status');
  if (!r.configured) { el.innerHTML = '<p class="dim">Live status isn\'t set up yet.</p>'; return setBox('Status not set up'); }
  if (r.error) { el.innerHTML = '<p class="dim">Status unavailable right now. Try again soon.</p>'; return setBox('Status unavailable'); }
  const d = r.data || {}, order = Object.keys(LABELS);
  const keys = [...order.filter(k => k in d), ...Object.keys(d).filter(k => !order.includes(k))]
    .filter(k => d[k] !== null && typeof d[k] !== 'object');
  const tiles = keys.map((k, i) => {
    const v = k === 'shutdown_timer' ? String(d[k]).replace(/_/g, ' ') : String(d[k]);
    const pc = BARS.includes(k) ? pct(k, d[k]) : null;
    return `<div class="tile" style="--i:${i}"><span>${esc(LABELS[k] || nice(k))}</span><b>${esc(v)}</b>` +
      (pc == null ? '' : `<div class="xp-bar"><div class="xp-fill" style="width:${pc}%"></div></div>`) + '</div>';
  }).join('');
  const cls = r.online ? 'on' : 'off', word = r.online ? 'Online' : 'Offline';
  el.innerHTML = `<div class="srv-head ${cls}"><span class="dot ${cls}"></span><b>${word}</b><span class="dim">Updated ${new Date().toLocaleTimeString()}</span></div><div class="tiles">${tiles}</div>`;
  setBox(`<span class="dot ${cls}"></span>${word}`);
}

async function loadStatus() {
  try { renderStatus(await (await fetch('/.netlify/functions/server-status')).json()); }
  catch (e) { renderStatus({ configured: true, error: true }); }
}
setInterval(() => { if (location.hash.startsWith('#/games')) loadStatus(); }, 60000);

/* ---- page text from JSON ---- */
fetch('plan.json', { cache: 'no-store' }).then(r => r.json()).then(p => {
  if (p.title) $('#mc-title').textContent = p.title;
  if (p.description) $('#mc-desc').textContent = p.description;
}).catch(() => {});

fetch('home.json', { cache: 'no-store' }).then(r => r.json()).then(h => {
  if (h.intro) $('#intro-text').textContent = h.intro;
  if (h.discord_invite) { const d = $('#discord'); d.href = h.discord_invite; d.hidden = false; }
  if ((h.highlights || []).length) {
    $('#highlights').innerHTML = h.highlights.map(x => `<div class="card"><b>${esc(x.title)}</b><p>${esc(x.text)}</p></div>`).join('');
    $('#hl-wrap').hidden = false;
  }
}).catch(() => {});
route();
