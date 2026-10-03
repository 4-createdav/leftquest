const fs = require('fs'), path = require('path');
const root = __dirname, out = path.join(root, 'dist'), fn = path.join(root, 'netlify-fn');
const read = f => JSON.parse(fs.readFileSync(path.join(root, f), 'utf8'));
for (const d of [out, fn]) { fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d, { recursive: true }); }
for (const f of ['index.html', 'style.css', 'app.js', 'admin.html', 'config.yml', 'home.json'])
  fs.copyFileSync(path.join(root, f), path.join(out, f));

const plan = read('plan.json');
// Server name/node stay private (function only).
fs.writeFileSync(path.join(fn, 'config.json'), JSON.stringify({ server_name: plan.shulker_server_name || '', node: plan.shulker_node || '' }));
fs.copyFileSync(path.join(root, 'server-status.js'), path.join(fn, 'server-status.js'));
delete plan.shulker_server_name; delete plan.shulker_node;
fs.writeFileSync(path.join(out, 'plan.json'), JSON.stringify(plan, null, 2));
console.log('built');
