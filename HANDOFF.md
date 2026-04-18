# Zed Informatique — Deployment Reference

Production info for the live site. **Do NOT put secrets (API keys, passwords) in this file.** Secrets live only in Convex env and Vercel env.

## Accounts (client-owned)

| Service | Account / Login location |
|---|---|
| GitHub | `zedinformatique2-glitch` — repo: https://github.com/zedinformatique2-glitch/zedinfo |
| Vercel | imported from GitHub repo above |
| Convex | team `zed-informatique`, project `zedinfo` |
| Hostinger | holds domain DNS (unless moved to Vercel nameservers) |
| OpenRouter | AI key for FPS estimator / chat / promos |
| Meta Business | Pixel `929394893194723` |
| Google | GSC + GA4 + GTM (see below) |

## Convex

- **Prod deployment:** `first-rabbit-857`
- **Prod URL:** `https://first-rabbit-857.eu-west-1.convex.cloud`
- **Prod dashboard:** https://dashboard.convex.dev/d/first-rabbit-857
- **Dev deployment:** `nautical-squid-800`

### Env vars set on prod
- `ADMIN_USERNAME` = `zedadmin`
- `ADMIN_PASSWORD` = *(set in Convex env)*
- `NEXT_PUBLIC_WHATSAPP_NUMBER` = `213663287772`
- `OPENROUTER_API_KEY` = *(set in Convex env — rotate if exposed)*

### Redeploy functions to prod
```bash
npx convex deploy
```

## Vercel

- **Project:** imported from `zedinformatique2-glitch/zedinfo`
- **Build command:** `npx convex deploy --cmd "npm run build" --yes`
- **Auto-deploys** on every push to `main`

### Env vars (Production)
- `NEXT_PUBLIC_CONVEX_URL` = `https://first-rabbit-857.eu-west-1.convex.cloud`
- `ADMIN_USERNAME` = `zedadmin`
- `ADMIN_PASSWORD` = *(same as Convex)*
- `NEXT_PUBLIC_WHATSAPP_NUMBER` = `213663287772`
- `CONVEX_DEPLOY_KEY` = *(from Convex dashboard → Deploy Keys)*

## Analytics / Tracking

Wired in `app/[locale]/layout.tsx` (public site only — admin pages do NOT track):

| Tool | ID |
|---|---|
| Meta Pixel | `929394893194723` |
| Google Tag Manager | `GTM-P8R9ZP5B` |
| Google Analytics 4 | `G-QZ21CMPYMX` |
| Google Search Console | verified via `verification.google` meta tag (token `e0PKvsr1-hqlZipEM5Ja8i-YUOBOtRpyQz0iAJ7sqBU`) |

## Domain (Hostinger → Vercel)

Option B (keep Hostinger DNS). In Hostinger DNS records:

| Type | Name | Value |
|---|---|---|
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |

Vercel auto-issues HTTPS. Propagation: 10 min – 2 h.

## Admin panel

- URL: `/admin/login` on the live site
- Username: `zedadmin`
- Password: as set in both Convex and Vercel env

## Common maintenance tasks

**Re-seed all products (wipes + reinserts):**
```bash
npx convex run --prod seedReal:default
```

**Upload new external images to Convex storage:**
```powershell
$env:NEXT_PUBLIC_CONVEX_URL="https://first-rabbit-857.eu-west-1.convex.cloud"
node scripts/upload-images.mjs
```

**Rotate a leaked secret:**
1. Regenerate in the provider's dashboard (OpenRouter / Convex deploy key / etc.)
2. Update in Convex: `npx convex env set --prod KEY "new-value"`
3. Update in Vercel: Project → Settings → Environment Variables (for `CONVEX_DEPLOY_KEY` and `NEXT_PUBLIC_*`)
4. Trigger redeploy in Vercel

**Push code → live:**
```bash
git push              # Vercel auto-deploys
# If you changed files in convex/ (not convex/_generated/), also:
npx convex deploy --yes
```
