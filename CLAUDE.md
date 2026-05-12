# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->

## Project

**Zed Informatique** — e-commerce + configurator site for an Algeria-based PC/IT business. Bilingual FR/AR (RTL), guest checkout, WhatsApp order flow, password-gated admin panel, Convex backend.

## Commands

```bash
npm run dev              # Next.js dev server (Turbopack)
npx convex dev           # Convex function watcher — run in a SECOND terminal during dev
npm run build            # Production build (runs typecheck + static generation)
npm run lint             # ESLint
npx convex run seed:default      # Seed 11 categories + 18 mockup products
npx convex run seedReal:default  # Seed 11 categories + 58 real products (from competitors)
node scripts/upload-images.mjs   # Upload external product images to Convex storage
npx convex env set KEY VALUE     # Set Convex deployment env vars
npx convex deploy        # Deploy Convex functions to production
```

There are no tests. Dev requires **both** `npm run dev` and `npx convex dev` running. Admin login uses `ADMIN_USERNAME` / `ADMIN_PASSWORD` from `.env.local`.

## Architecture

### Two independent root layouts, no shared `app/layout.tsx`

- `app/[locale]/layout.tsx` — public site. Emits its own `<html lang={locale} dir={rtl ? "rtl" : "ltr"}>`, loads Inter + Material Symbols, wraps in `NextIntlClientProvider` (messages must be passed explicitly via `getMessages({ locale })`) and `ConvexClientProvider`.
- `app/admin/layout.tsx` — admin. Emits its own `<html>`, always LTR French, cookie-gated via middleware.

Do **not** add `app/layout.tsx` — it will conflict with the two locale/admin roots.

### i18n (next-intl 3.26)

- Locales: `fr` (default) and `ar`. Routing via `lib/i18n/routing.ts` (`defineRouting` + `createNavigation`). Always import `Link` / `useRouter` from `@/lib/i18n/routing`, never from `next/link` or `next/navigation`, so locale prefixes are preserved.
- Messages live in `messages/fr.json` and `messages/ar.json`. The locale layout loads them via `getMessages({ locale })` and passes them as a prop — the implicit context lookup doesn't work reliably with Next 15 + App Router.
- RTL is driven by `dir` on `<html>` + Tailwind logical properties (`ms-*`/`me-*`/`ps-*`/`pe-*`) via the `tailwindcss-rtl` plugin. Do not use `ml-*`/`mr-*` on layout-critical spacing.

### Middleware gates two things

`middleware.ts` runs the next-intl locale router **and** a cookie check for `/admin/*` (except `/admin/login`). Unauthenticated admin hits get redirected to `/admin/login`. Keep both branches in sync if you touch it.

### Convex backend

- Schema in `convex/schema.ts`. Key tables: `categories`, `products` (with text search index on `nameFr`), `prebuilts`, `orders` (with `by_status` / `by_createdAt` / `by_orderNumber` indexes), `savedBuilds`.
- `convex/orders.ts` generates order numbers as `ZED-YYMMDD-####` and decrements `products.stock` atomically inside the `create` mutation. Never decrement stock from a query.
- `convex/` is **excluded** from the root `tsconfig.json` because Convex ships its own typechecker. Do not re-include it or `next build` will drown in false positives.
- `convex/_generated/*` files are real once `npx convex dev` has run. Before the first run, they may be `anyApi` stubs (this is how the repo builds offline). If you see placeholder `api.js` using `anyApi` from `convex/server`, leave it — `convex dev` will overwrite it.

### Cart & checkout

- Cart state is Zustand + `persist` middleware (localStorage), in `lib/cart-store.ts`. Client-only. Anything that reads it must gate on a `mounted` boolean to avoid hydration mismatch (`cart/page.tsx` and `checkout/page.tsx` show the pattern).
- Checkout is a single server-action-free client form: `react-hook-form` + `zod` → `useMutation(api.orders.create)` → on success, either redirect to `/order/[id]` (COD) or build a WhatsApp URL via `lib/whatsapp.ts` and `window.location.href` to it.
- Shipping cost comes from `lib/wilayas.ts` (`getShippingCost(wilaya)`). Currently a flat 800 DZD — upgrade here when per-wilaya rates are known.

### Configurator compatibility engine

`lib/configurator-engine.ts` is a pure-TS function `checkCompatibility(selection)` returning `{ compatible, errors, warnings, estimatedWattage, recommendedPsu, totalPrice }`. It validates socket match, RAM type/slots/capacity, motherboard/case form factor, GPU length, cooler height/socket/TDP, and PSU wattage with 30% headroom. The configurator page (`app/[locale]/configurator/page.tsx`) and any save/share code must pass the full selection object into it — do not re-implement checks inline.

Product `specs` must match the shape the engine expects (`type: "cpu" | "motherboard" | ...` plus fields per type). The seed (`convex/seed.ts`) is the reference for valid spec shapes.

### Admin auth

- `app/admin/login/page.tsx` is a server-action form that checks `ADMIN_USERNAME` + `ADMIN_PASSWORD` from `process.env` and sets an `admin_session` httpOnly cookie. This is **Next.js** env, not Convex env — even though the vars may also exist on Convex, the gate reads from `.env.local`.
- `app/api/admin/logout/route.ts` clears the cookie.
- Admin is intentionally outside `[locale]` and French-only. Do not add locale routing to `/admin/*`.

## Design system

- Brand color navy `#0035d0` (`primary` token). Full Material Design 3 palette in `tailwind.config.ts`.
- Font: Inter via `next/font/google`, CSS variable `--font-inter`. Material Symbols loaded from the Google CDN.
- **Radius language — NO SHARP BOXES.** Every box, card, panel, modal, input, contact tile, slot, error/warning, picker item, share-code box, etc. **must** use a rounded radius — typically `rounded-xl` (small chips/inputs), `rounded-2xl` (cards/panels/pickers/slot cards), or `rounded-3xl` (large containers/modals/forms). `borderRadius.DEFAULT` is `0px` only so that intentional full-bleed sections (hero strips, the dark sticky configurator bar, page-wide bands) stay edge-to-edge — those are *not* boxes. If you are creating any element that visually reads as a box (it has a background color, ring, border, or shadow setting it apart from the page), it **must** be rounded. Pair the radius with `shadow-card` + `ring-1 ring-outline-variant/40` for the standard polished look, and `hover:shadow-card-hover hover:-translate-y-0.5` for interactive cards. Buttons follow `components/ui/Button.tsx` (rounded-xl + shadow + lift). Do **not** bring back fully-square buttons or boxes.
- Product cards are the reference for "modern polished" card UI — see `components/shop/ProductCard.tsx`. No star ratings anywhere on the site.
- Currency formatting via `lib/format.ts` (`formatDzd(amount, locale)`). Product names via `localizedName(product, locale)` — never render `nameFr`/`nameAr` directly in user-facing UI.

## Images

- Product images are stored in **Convex file storage** (not hotlinked). `next.config.ts` whitelists `*.convex.cloud`, `*.convex.site`, and `lh3.googleusercontent.com`.
- Never hotlink images from external retailers — they block server-side fetches (403). Always download locally then upload to Convex storage.

## Adding new products from competitor websites

Proven workflow for scraping real products from Algerian PC retailers and importing them:

1. **Browse the competitor site** using Chrome MCP tools (`navigate_page`, `take_snapshot`, `evaluate_script`).
2. **Extract product data** by running JS on the page: name, price (DZD), image URL, specs. Use `evaluate_script` with a script that queries `.product` elements.
3. **Create a seed file** (`convex/seedReal.ts` is the reference) with proper `specs` objects matching the configurator engine types (`cpu`, `gpu`, `motherboard`, `ram`, `storage`, `psu`, `case`, `cooler`).
4. **Run the seed**: `npx convex run seedReal:default`
5. **Upload images to Convex storage** using `scripts/upload-images.mjs` — this downloads from the retailer (works from local Node with User-Agent/Referer headers) and uploads to Convex file storage, then updates product records with the Convex URLs.
   ```bash
   node scripts/upload-images.mjs                          # dev
   NEXT_PUBLIC_CONVEX_URL=https://joyous-marlin-205.eu-west-1.convex.cloud node scripts/upload-images.mjs  # prod
   ```
6. **Deploy**: `npx convex deploy --cmd "npm run build" --yes` then `git push` for Vercel.

Key competitor sites: `wifidjelfa.com` (Djelfa), and others as discovered. Category URL patterns for wifidjelfa: `/product-category/99236150627014130/99236150627008520/` (CPUs), `...8523` (GPUs), `...8524` (Motherboards), `...8525` (RAM), `...8540` (SSDs), `...8526` (PSUs), `...8522` (Cases), `...8521` (Cooling).

## Deployment rule

When the user asks to **push** (git push), check if any files inside `convex/` (excluding `convex/_generated/`) were modified in the commits being pushed. If so, **also run `npx convex deploy --yes`** before or after the push so production Convex functions stay in sync. Forgetting this causes runtime errors on the live site.

## Client deployment (this repo is the live production site)

The repo points at a **client-owned** GitHub account. Code goes live via Vercel auto-deploy on `main`. Do not spin up new Convex projects or new Vercel projects unless explicitly asked — the live infrastructure already exists.

### Live environment

- **GitHub repo:** https://github.com/zedinformatique2-glitch/zedinfo (client's account, developer is collaborator)
- **Convex prod deployment:** `first-rabbit-857` — https://first-rabbit-857.eu-west-1.convex.cloud
- **Convex prod dashboard:** https://dashboard.convex.dev/d/first-rabbit-857
- **Convex dev deployment:** `nautical-squid-800` (set in `.env.local`)
- **Vercel project:** imported from the GitHub repo; auto-deploys on push to `main`; build command is `npx convex deploy --cmd "npm run build" --yes`
- **Domain:** DNS on Hostinger, points to Vercel (`A @ → 76.76.21.21`, `CNAME www → cname.vercel-dns.com`)

See `HANDOFF.md` at repo root for the full non-secret reference (analytics IDs, DNS records, admin URL, maintenance commands).

### Standard update flow (code change → live)

1. Edit files locally as usual.
2. If anything under `convex/` (excluding `convex/_generated/`) changed, run `npx convex deploy --yes` **before** pushing — Vercel also runs it during build, but deploying first regenerates `convex/_generated/api.d.ts` so the typecheck on Vercel passes. **Commit the regenerated `api.d.ts`** along with the feature files or the Vercel build will fail with `Property 'X' does not exist on type ...`.
3. `git add <feature files> convex/_generated/api.d.ts` → commit → push. Vercel auto-deploys within ~2 min.
4. For icon/logo/asset-only changes: just push, no Convex step.

### Git push over flaky network

GitHub HTTPS/2 sometimes hangs on this machine's network (seen during initial handoff). If a push stalls, retry with HTTP/1.1:
```bash
git -c http.version=HTTP/1.1 push
```
Or persist it once: `git config --global http.version HTTP/1.1`.

### Secrets — never commit, never paste in chat

Live secrets live ONLY in the Convex env store and Vercel env store:
- `OPENROUTER_API_KEY` (Convex, used by FPS estimator / AI chat / promo gen)
- `ADMIN_PASSWORD` (both Convex and Vercel, kept in sync)
- `CONVEX_DEPLOY_KEY` (Vercel only — used by the build command)

If a secret shows up in a chat, commit, or log: **rotate it immediately** in the provider dashboard, then update both Convex (`npx convex env set --prod KEY "new"`) and Vercel (Project → Settings → Environment Variables).

### Updating Convex env vars

```bash
npx convex env set --prod KEY "value"    # production
npx convex env set KEY "value"           # dev
```
Takes effect immediately — no redeploy needed. Vercel env vars do need a redeploy to take effect (trigger one from the Vercel dashboard or push an empty commit).

### Analytics / tracking already wired

In `app/[locale]/layout.tsx` (public site only — admin pages do not track):
- Meta Pixel `929394893194723` (also fires on `/lp/*` via `app/lp/layout.tsx`)
- Google Tag Manager `GTM-P8R9ZP5B`
- Google Analytics 4 `G-QZ21CMPYMX`
- Google Search Console verified via `metadata.verification.google`

Landing pages at `/lp/[slug]` additionally fire `ViewContent`, `InitiateCheckout`, and `Purchase` Meta events for ad optimization.

### Landing page generator

Admin UI at `/admin/landing-pages` creates conversion-style pages at `/lp/[slug]`. Each landing page references one product and overrides price, headline, bullets, CTA, countdown, stock urgency. Pages are `noindex`. Backend functions in `convex/landingPages.ts`; schema table `landingPages` with `views` / `orders` counters. The public route bypasses next-intl (see `middleware.ts`) and has its own `app/lp/layout.tsx` root.

## Performance — what's already been done (May 2026)

A site-speed pass landed in commits `1390301` (safer-scope wins) and `6b81b21` (icon-CLS fix). Results were partial: mobile LCP 33.5s → **8.3s** and total payload 15 MB → 6 MB are real wins, but the overall PageSpeed score is still in the **40s on both mobile and desktop** as of last measurement. The remaining drag is render-blocking CSS + the 444 KB Cairo woff2 — see "Still open" below. Before re-attempting performance work, know what was tried and what regressed:

**Currently in production (do NOT undo):**
- `public/build-pc.gif` (8.9 MB) replaced by `public/pc-buildgif.webp` (31 KB) via `next/image` on the home page. The GIF file still sits in the repo for now but is unreferenced.
- Category JPGs in `public/categories/categories/` compressed in place (3.0 MB → 280 KB). Filenames and paths unchanged on purpose.
- Material Symbols stylesheet uses `display=swap` (not `block`) in all three layouts.
- `.material-symbols-outlined` in `app/globals.css` has `width: 1em; overflow: hidden` — required to clip the ligature-text fallback so the icon swap doesn't cause CLS. Don't remove this.
- Hero `<video>` has explicit `width={1920} height={1080}` for CLS but still uses `preload="auto"` — the video is the LCP element, must stay full-priority.
- `loading="lazy"` on `components/home/PromoCarousel.tsx` only.
- `min-h-[56px] md:min-h-[64px]` on `BrandMarquee` mask div for CLS.
- One-shot encoder lives at `scripts/compress-categories.mjs` (sharp; mozjpeg quality 78, max width 800). Re-run if you add new category images.

**Tried and reverted — do NOT redo (commit `cf38515` reverts `1c2adb3`):**
- Converting category JPGs to **renamed** `.webp` files and updating `CategoryGrid.tsx` references — broke image loading on prod (root cause not fully isolated; safest theory is Vercel CDN cache during deploy window). Keep `.jpg` extensions, compress in place.
- Adding a duplicate `<Image priority>` poster on top of the hero `<video>` — fetches `hero1.webp` twice and didn't change the LCP candidate.
- Changing hero video to `preload="metadata"` — the video IS the LCP element; downgrading its preload regressed mobile LCP.
- `loading="lazy"` on `components/shop/ProductCard.tsx` — likely lazy-loaded above-the-fold featured products on the home page, regressing LCP.

**Still open if you want more wins on mobile:**
- Arabic Cairo font (`fonts.googleapis.com`) ships a ~444 KB woff2 that costs ~2.9s on slow 4G. Preload it, or trim weights to the ones actually used (`400` and `700` cover most of the site).
- ~14 KiB of CSS is render-blocking (Tailwind output + a small chunk). Inlining critical CSS or splitting per-route would shave ~350-500ms.
- `lh3.googleusercontent.com` `preconnect` in `app/[locale]/layout.tsx` is unused since product images moved to Convex storage — safe to remove.

**Permanent constraint:** `next.config.ts` has `images.unoptimized: true` — set in commit `29a7e56` to stay inside Vercel's free image-optimization quota on Convex-hosted product images. Don't flip it back unless the quota issue is resolved. All optimization must happen at the source (WebP encoding, compressing JPGs before checkin, proper `sizes` attribute on `<Image>`).

## Gotchas

- Port 3000 may be in use by another process; Next will fall back to 3001. Check the dev server output when smoke-testing URLs.
- If you see `MISSING_MESSAGE` at build time on a client page, the `messages` prop is missing from `NextIntlClientProvider` — don't try to fix it with `use client` / dynamic rendering, fix the provider.
- `convex/_generated` may be deleted by `npx convex dev` on first run and replaced with real files; the stub `api.js` uses `anyApi` from `convex/server` specifically so `useMutation(api.foo.bar)` doesn't crash at prerender before Convex is provisioned.
- After changing Tailwind config or anything that affects build cache, stop the dev server before running `next build` (Turbopack's `.next/cache` conflicts with the Webpack build and throws `Cannot find module '../chunks/ssr/[turbopack]_runtime.js'`). Run `rm -rf .next && npm run build` if you hit it.

## Mockup → route mapping (source of truth for layouts)

The HTML mockups in `D:/ZED INFORMA/stitch/stitch/` are the design reference:

| Mockup folder | Ported to |
|---|---|
| `zed_informatique_home_full_hero` | `app/[locale]/page.tsx` |
| `about_us_deep_navy_update` | `app/[locale]/about/page.tsx` |
| `category_listing_graphics_cards` | `app/[locale]/shop/[category]/page.tsx` |
| `zed_informatique_product_details` | `app/[locale]/product/[slug]/page.tsx` |
| `ready_to_go_pc_details` | `app/[locale]/prebuilt/[slug]/page.tsx` |
| `polished_pc_configurator` | `app/[locale]/configurator/page.tsx` |
| `shopping_cart` | `app/[locale]/cart/page.tsx` |
| `after_sales_support` | `app/[locale]/support/page.tsx` |

When fixing layout issues, check the original HTML in `stitch/` first — it's the ground truth for spacing, typography, and section order.
