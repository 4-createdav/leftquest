# The Vault - game server status hub (flat folder)

Home, and Games > Minecraft with live Shulker server stats. Upload all files to the root of a GitHub repo, then import it in Netlify.

| File | Purpose |
|---|---|
| index.html, style.css, app.js | The site |
| admin.html, config.yml | Admin panel at /admin (Decap CMS, email + password via Netlify Identity) |
| plan.json | Minecraft page title/description + Shulker server name and node |
| home.json | Home intro, Discord link, highlights |
| server-status.js | Netlify function that calls the Shulker API |
| build.js, netlify.toml, package.json | Build config |

## Live status setup
1. Netlify > Project configuration > Environment variables > add `SHULKER_API_KEY` (key with only `server_status` read permission).
2. Fill in `shulker_server_name` and `shulker_node` (in /admin > Minecraft server, or edit plan.json).
3. Redeploy. The server IP is deliberately not shown.

Local preview: `node build.js && npx netlify dev`

## Admin login (email + password)
Netlify > Project configuration > Identity > Enable Identity (Registration: Invite only) > Services > Git Gateway > Enable. Invite your email, open the link, set a password, then log in at /admin.
