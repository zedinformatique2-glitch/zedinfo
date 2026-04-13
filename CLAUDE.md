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
