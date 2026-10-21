# ShopWithAbhi

live-link : https://shopwithabhi-pghg.vercel.app/

A Next.js App Router publication for product discovery, research-based reviews, buying guides, comparisons, and Amazon affiliate links. The interface uses ivory, charcoal, orange accents, restrained motion, and an editorial layout.

## What is implemented

- Responsive, server-rendered public pages; search and category filtering; newest/oldest ordering; cursor pagination.
- A product-focused homepage following the owner's supplied visual reference: a photographic hero with working search, a second header search, six illustrated category cards, featured review cards, side-by-side comparison/guide sections, articles, and a compact newsletter. Repeated story rails, discovery tabs and decorative promise blocks have been removed.
- GSAP staggered hero entrances, a subtle hero image entrance, ScrollTrigger section/card reveals, menu/dialog transitions, and article reading progress. Animations clean up on unmount and respect reduced-motion preferences; essential content stays visible without JavaScript.
- Product, guide, article, and comparison pages; sources, verification dates, pros/cons, specifications, related content, reading time, sanitized rich text, and article navigation.
- Google sign-in through stable NextAuth v4, with a short-lived signed JWT bridge to Convex's documented custom-JWT authentication.
- Private reading lists, profile preferences, sign-out, and account deletion requests.
- An independently protected admin area: content authoring with TipTap, drafts, previews, publishing, archiving, categories, roles, contact inbox, newsletter records and CSV export, public settings, and audit logs.
- Convex schema, indexes, search indexes, runtime validators, backend authorization, form rate limits, and retention cleanup.
- Manually managed affiliate destinations, a strict HTTPS/domain allowlist, safe stored-destination redirects, optional minimal click events, and disabled buttons for missing URLs.
- Contact and consent-based newsletter persistence, secret-token unsubscribe, SEO metadata, sitemap, robots, accessibility states, and reduced-motion support.
- Unit/backend tests, desktop/mobile browser tests, and production build configuration.

**Deployment status:** the configured Convex development backend is deployed, its public functions respond, and the six starter categories are stored in that deployment. Local signing keys and the matching Convex authentication/form configuration are set up. An administrator email allowlist is configured; the first verified Google sign-in with that address creates the administrator account. Live Google consent/login, an authenticated browser session, email delivery, and Vercel production deployment still need verification or setup. No product content or user activity is fabricated.

There are no sample product claims, reviews, prices, ratings, testimonials, or invented users. Six initial category definitions can be added by an administrator. Test fixtures stay in isolated tests.

## Versions and prerequisites

Use Node.js 22 or 24 and npm. Development was verified with Node 24.

Pinned dependencies include Next.js 16.4.2, React 19.3.1, Convex 1.47.0, NextAuth 4.24.15, Tailwind 4, TipTap 3, GSAP 3, Zod 4, Vitest, and Playwright. `package-lock.json` makes installations reproducible.

NextAuth v5 is still labelled beta in the official integration documentation at implementation time. This application deliberately uses stable v4 rather than treating its encrypted session cookie as a Convex token.

## Start locally

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. You can inspect the complete public layout before connecting services. Sign-in explains missing configuration; public forms return a clear unavailable message.

For a local production-mode check:

```powershell
npm run build
npm start
```

The font build downloads DM Sans and Manrope using `next/font`. It needs network access on the first build; fonts are then served by Next.js.

## Connect Convex and Google

1. Create your own Convex account/project:

   ```powershell
   npx convex dev
   ```

   Follow the interactive project selection. Convex writes `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL` to `.env.local`, deploys the functions, and refreshes `convex/_generated/`. Leave this running in a separate terminal. `convex.json` explicitly requests TypeScript code generation.

2. Generate application signing material:

   ```powershell
   npm run keys
   ```

   This writes **ignored** `auth-keys.local.json` and refuses to overwrite an existing file. Do not commit, upload, or paste this file into a chat. Copy `AUTH_PRIVATE_JWK`, `NEXTAUTH_SECRET`, and `FORM_GATEWAY_SECRET` to the Next.js `.env.local`. For the JWK, wrap the one-line JSON in single quotes in dotenv.

3. Set the following **Convex development deployment environment variables** in the Convex dashboard under Settings → Environment Variables:

   - `AUTH_ISSUER=http://localhost:3000`
   - `AUTH_JWKS`: the generated **public** JWKS data URI
   - `ADMIN_EMAILS`: your verified Google email, or a comma-separated allowlist
   - `FORM_GATEWAY_SECRET`: the same generated secret used in Next.js
   - `AFFILIATE_CLICK_TRACKING=false`

   Do **not** put the private signing key in Convex. The data URI avoids requiring Convex to reach a localhost JWKS endpoint.

4. In Google Cloud Console, configure an OAuth consent screen and a **Web application** OAuth client. During testing, add your Google account as a test user. Register:

   - Authorized JavaScript origin: `http://localhost:3000`
   - Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

5. Add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_URL=http://localhost:3000`, and `AUTH_ISSUER=http://localhost:3000` to `.env.local`. Keep `NEXT_PUBLIC_SITE_URL=http://localhost:3000`.

6. Restart Next.js and let Convex finish deploying. Open `/signin`. The first verified Google login creates a Convex user. Accounts matching the Convex-side allowlist receive administrator access; all others receive `USER`.

For a configured development project, the repeatable setup command is:

```powershell
npm run setup:backend
npm run check:backend
```

`setup:backend` only accepts a matching `dev:` deployment and Convex URL. It generates missing signing keys in ignored `.env.local`, preserves existing credentials, checks that public and private keys match, transfers the required backend variables to that Convex deployment, and deploys/typechecks the functions. Set `ADMIN_EMAILS` first, or pass `-- --admin-email=your-google-email` to configure it. The private signing key stays local. This command transfers `FORM_GATEWAY_SECRET` to your own Convex deployment because both sides must share it.

If the CLI reports a missing `convex/tsconfig.json` on an older checkout, run `npx convex codegen --init`, then rerun setup. The generated TypeScript configuration is now included in the project. To initialize missing starter categories without creating products or users, a deployment operator can run `npx convex run bootstrap:categories`. This is an internal function, inaccessible to browser clients; reruns preserve existing category records and edits.

If you see **Could not find public function for 'content:settings'**, the selected Convex deployment has not received this project's functions. Updating `.env.local` does not deploy them or configure cloud variables. Run the setup command, check all three public queries with `check:backend`, then restart Next.js. Do not hide a deployment failure by substituting mock data.

### Environment ownership

| Variable                                     | Where                         | Purpose                                                     |
| -------------------------------------------- | ----------------------------- | ----------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                       | Next.js / Vercel              | Canonicals, sitemap, form origin validation                 |
| `NEXT_PUBLIC_CONVEX_URL`                     | Next.js / Vercel              | Public deployment URL                                       |
| `CONVEX_DEPLOYMENT`                          | Local CLI                     | Development deployment selection                            |
| `CONVEX_DEPLOY_KEY`                          | Vercel build environment only | Deploy the selected backend; never public                   |
| `NEXTAUTH_URL`                               | Next.js / Vercel              | OAuth site origin                                           |
| `NEXTAUTH_SECRET`                            | Next.js / Vercel              | Encrypt/sign NextAuth sessions                              |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`   | Next.js / Vercel              | Google OAuth                                                |
| `AUTH_PRIVATE_JWK`                           | Next.js / Vercel only         | Sign five-minute Convex tokens                              |
| `AUTH_ISSUER`                                | Both Next.js and Convex       | Exact matching token issuer                                 |
| `AUTH_JWKS`                                  | Convex only                   | Public verification keys, encoded as data URI               |
| `ADMIN_EMAILS`                               | Convex only                   | First-login administrator allowlist                         |
| `FORM_GATEWAY_SECRET`                        | Both Next.js and Convex       | Authenticate the validated public-form gateway              |
| `AFFILIATE_CLICK_TRACKING`                   | Both Next.js and Convex       | Optional clicks, default false                              |
| `AMAZON_MARKETPLACE`, `AMAZON_ASSOCIATE_TAG` | Owner reference               | Reserved business configuration; no URLs are auto-generated |

Production builds on Vercel validate required Next.js credentials, HTTPS origins, secret lengths, and signing-key shape. Convex environment values must be set separately. Local `.env.local` values are **not** automatically copied to Vercel or Convex.

### Authentication and authorization

Google verification is checked during sign-in. NextAuth maintains an encrypted, HTTP-only session cookie. `/api/convex-token` validates that server session and signs a five-minute RS256 JWT containing the stable Google subject, issuer, audience, and verified profile claims. Convex checks signature, issuer, audience, and expiration before backend functions look up the user.

The custom-JWT provider exposes `email_verified` and `picture` as raw signed claims; other OIDC providers may expose `emailVerified` and `pictureUrl`. `convex/identity.ts` handles both shapes. Verification must be the boolean `true`; strings such as `"true"` are rejected. All private profile access checks this verified identity. `npm run check:backend` now verifies both the signature and recognized email-verification claim against the actual deployment, using a read-only probe without creating a user. If profile sync fails, dashboard guards redirect to a sign-in connection error instead of rendering a server exception, and client-side sync failures are visible.

Roles are read from Convex, not from a browser-provided role. Admin queries/mutations enforce roles every time. A reader cannot select another user ID for saved-item or profile operations. Admin pages also have server guards. The short-lived JWT may remain cryptographically valid briefly after browser sign-out; role and deletion status checks still apply to each private operation.

Anonymous visitors can use **Log in** and **Sign up** in the desktop header. On phones, Log in stays in the header and both actions are available in the mobile menu. `/signin?mode=signup` explains first-login account creation with Google; there is no separate password registration. The sign-in page also links to `/signin?mode=admin` for editorial users. Choosing that page does not grant administrator permissions. Signed-in readers see account and reading-list links plus sign-out; only a confirmed Convex administrator sees **Admin dashboard**. The account settings shortcut opens the profile/preferences tab.

Keep `AUTH_ISSUER` stable after creating accounts, even if you later change the public domain. User identities include the issuer. A deliberate issuer change needs a reviewed user migration.

The allowlist is checked when an account is first created. If you logged in before configuring it, an existing administrator can promote you in `/admin/users`. If no administrator exists, the Convex project owner can change that exact verified user record's role using the authenticated Convex dashboard. This is an operator-only bootstrap procedure, not a public API. Never make promotion a browser-controlled mutation.

For key rotation, publish a JWKS containing both old and new public keys, deploy the new private key with a new `kid`, wait beyond the five-minute token lifetime, then remove the old key.

## Publishing content

1. Open `/admin/categories`. Use **Create the six starter categories**, or add your own.
2. In `/admin/products`, add a product title, clean slug, excerpt, permitted imagery, body, category, specifications, pros/cons, audience, source, and last verification date.
3. Enter a real affiliate URL only when available. The record can exist without it; the admin warns and the public button is disabled.
4. Use **Preview body** to check sanitized editor content. Save as Draft until claims and sources have been checked. Change status to Published and save when ready.
5. In `/admin/articles`, choose Journal article or Buying guide. Add headings for an automatic table of contents, tags, SEO text, and related items.
6. In `/admin/comparisons`, select products and write the reasoning/conclusion. Shared specification labels become table criteria. Missing values are labelled, never invented.
7. Use Archive to unpublish safely. Archiving retains references and saved-item relationships while hiding the item from public queries and saved lists.

Slugs are unique across all content types. A unified `content` table keeps search, saved items, relationships, and publication rules consistent. Tags and related IDs are bounded arrays, rather than extra join tables. Images can be configured with local `/public` paths or the approved remote hosts in `next.config.ts`. This implementation uses URL configuration, not a file uploader.

Admin record lists are paginated; the text/status filters apply to records already loaded. Use Load more to extend them. Related-item selection initially loads 100 records; large catalogs should add a paginated relationship picker. Overview counts visibly cap at 1,000 to avoid unbounded queries.

## Branding, settings, and legal copy

- `src/config/site.ts`: brand defaults, locale, timezone, currency, owner contact placeholders.
- `src/config/navigation.ts`: navigation and initial categories.
- `src/components/shopping-hero.tsx`: homepage hero, search, default copy and scoped GSAP timeline; admin hero copy overrides still apply.
- `src/app/page.tsx`: category artwork mapping and published-content sections. Reviews show five cards, guides and comparisons use compact grids, and articles/updated guides appear when published data exists. Empty review collections point to the real methodology page; guide collections point to actual category routes.
- `src/config/affiliate.ts`, `marketplace.ts`: disclosure, approved destinations, marketplace definitions.
- `src/config/legal.ts`: editable draft policies and About copy.
- `src/config/social.ts`, `feature-flags.ts`: centralized future integration defaults.
- `/admin/settings`: public copy overrides, hero, branding, legal text, disclosure, newsletter visibility, marketplace and SEO defaults.
- `src/app/globals.css` and `src/app/publication.css`: shared tokens, public/detail layouts, menus and reading-progress styles.
- `src/app/glass.css`: frosted navigation and panels, card states, mobile stacked actions, and reduced-transparency/reduced-motion adaptations; final colors come from `palette.css`.
- `src/app/palette.css`: the final ivory/charcoal/orange theme. Shared tokens in `globals.css` use `#FFFDF8` for the main background, `#FFFFFF` for cards, `#FF8A00` for primary buttons, `#222222` for headings/navigation, `#666666` for secondary text, `#F1EEE8` for section backgrounds, and `#E8E4DC` for borders. Primary orange buttons use charcoal text; text links use a darker orange for readability.
- `src/app/shopping.css`: the compact storefront layout, two-row desktop header, product/card grids, mobile hero composition and newsletter band.
- `public/logo.svg` and `src/app/icon.svg`: original vector brand assets.

No real contact address, company history, registration, or social profile is invented. Legal pages are deliberately labelled **draft / owner review required**. Complete owner details and obtain appropriate review before removing that label in the legal page template.

The hero and six-category strip are original generated artwork in `public/editorial/shopping-hero.png` and `public/editorial/category-artwork.png`; their prompts, dimensions and usage are documented in `docs/homepage-artwork.md`. They illustrate shopping categories and are never used as reviewed product photographs. The workspace and kitchen collection spotlights use bundled stock photography; source identifiers and the license link are recorded in `public/editorial/SOURCES.md`. All homepage photographs are local and use Next.js optimization, avoiding remote image requests at runtime. Published content uses its owner-configured image, with an editorial icon when missing. Verify your publication rights for added imagery. Do not scrape Amazon images or customer reviews.

## Affiliate operations

The implementation does not need Amazon API access and contains no scraper or fake product-data API. No prices or stock levels are displayed.

Manually enter product-specific affiliate URLs in the editor. The allowlist accepts exact Amazon India, US, and UK domains over HTTPS. Shorteners, credentials in URLs, nonstandard ports, misleading subdomains, HTTP, and placeholder tracking IDs are rejected. To add a marketplace, update the shared allowlist in `src/config/affiliate.ts`, add its marketplace configuration, and extend the tests.

`/go/[slug]` reads a published product and redirects only to its stored, validated destination. Visitor-supplied `url` parameters are never used. Affiliate links use `sponsored nofollow noopener noreferrer`. Missing or unpublished products return 404.

Tracking is off by default. When enabled in **both** environments, click records contain only product ID, marketplace and timestamp. A daily HMAC of the platform-provided visitor IP is used for temporary rate limiting; raw IPs are not stored. Clicks do not represent purchases or commissions. Automatic tests never visit live affiliate links.

## Newsletter, contact, and retention

Forms use Zod at the HTTP boundary and independent checks in Convex. Only the secret-bearing server gateway can persist anonymous contact/newsletter submissions. A honeypot and five-submissions-per-hour hashed-visitor limit are included. On Vercel the trusted platform forwarding header is used; on local development all submissions share the `local` bucket. Additional edge abuse protection can be configured in Vercel.

Contact messages are stored in the private admin inbox. Newsletter records preserve explicit consent and timestamps, deduplicate email addresses, and support unsubscribe. A new subscription displays a secret unsubscribe link; its hash, not the token, is stored. Existing active subscriptions keep their original secret. Keep the link during development. Signed-in readers can also turn off newsletter preferences for their account email.

No emails are sent: a transactional/marketing provider and confirmation/delivery workflow are intentionally not implemented without account selection and credentials. The UI explicitly says so. Before sending campaigns, add verified delivery, confirmation as required, unsubscribe links, suppression handling, and applicable compliance review. Export contains only consented subscribers and is admin-only.

Daily cleanup deletes up to 500 expired rate-limit rows and 500 click records older than 90 days per run. Contact/subscriber retention is operator-managed through the admin screens; select a lawful policy before launch and automate it if needed. Account deletion requests immediately disable private account access and newsletter consent. An administrator can complete deletion of that user's profile, saved items, and newsletter record. Contact messages and audit records require a separate lawful-retention review.

## Vercel deployment

1. Create a Git repository and push to a private or public GitHub repository you control. Review staged files: `.env.local`, `auth-keys.local.json`, deployment keys, and OAuth secrets must remain ignored.
2. Select the existing deployed Convex backend and set its HTTPS URL as `NEXT_PUBLIC_CONVEX_URL` in Vercel. The default build only deploys the frontend; it does not change backend code or require `CONVEX_DEPLOY_KEY`. Reusing the current development backend works for initial deployment, but it continues to share development data. Use a separate production backend for a public launch with isolated data.
3. Set the signing material, gateway secret, and **exact existing** `AUTH_ISSUER` matching that backend. An existing issuer such as `http://localhost:3000` is a signed identifier, not a network endpoint or OAuth callback. It can remain unchanged when deploying the frontend over HTTPS. For a new production backend, generate separate signing/session/gateway secrets and choose a stable HTTPS issuer.
4. Import the repository into Vercel using the Next.js preset. Set the root directory to this project.
5. Set Vercel environment variables from the table. You do not need to buy or invent a domain: Vercel assigns a free `.vercel.app` address when importing the project. Enable **Automatically expose System Environment Variables** in Vercel settings. For Production, missing, placeholder, or localhost `NEXT_PUBLIC_SITE_URL` / `NEXTAUTH_URL` values automatically resolve to `https://<VERCEL_PROJECT_PRODUCTION_URL>` during the build. The resolved public origins are included in the Next.js configuration for runtime use. Set both explicitly if using a custom domain. Preview uses its own `VERCEL_URL`; its Google callback still requires registration.
6. A deploy key is optional for the default frontend build. Only if automatically deploying backend changes too, create a Convex **production deploy key**, add it as `CONVEX_DEPLOY_KEY` scoped to **Production only**, and change the Vercel Build Command to `npm run deploy:full`.
7. Register the production Google callback: `https://YOUR_ACTUAL_VERCEL_HOST/api/auth/callback/google`. Update the consent-screen authorized domains/test-user/publishing configuration as applicable.
8. Ensure backend queries exist before the first frontend build. The current configured backend is already deployed. When selecting a new production backend, deploy its functions separately and configure its matching JWKS, issuer, gateway secret and administrator allowlist.
9. `vercel.json` runs `npm ci`, then `npm run deploy:build` (which runs `npm run build`). Configuration validation still requires HTTPS for the public site, OAuth callback and backend URL. The optional `npm run deploy:full` checks the production deploy key **before** contacting Convex, then runs:

   ```text
   convex deploy --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL --cmd "npm run build"
   ```

   In this optional combined mode, the Convex CLI supplies the deployment URL to the frontend build. Development keys remain blocked for this mode in Vercel Production.

10. Deploy in Vercel. Check build and function logs, visit the returned HTTPS URL, and complete the smoke tests below.
11. Branch previews can build against an explicitly configured existing backend, or use a **separate preview deploy key** scoped to Preview with the combined command. Do not reuse the production key. Preview OAuth needs an approved callback host; avoid passing production secrets into arbitrary untrusted pull requests.

When connecting a custom domain later, use Vercel's Domains panel and its displayed DNS records. Update public origin, `NEXTAUTH_URL`, Google OAuth callback/authorized origins, and social/SEO links. Keep the JWT issuer stable unless intentionally migrating identities. Verify HTTPS, redirects, canonicals, sitemap, cookies, and form origin checks. Redeploy after changing build-time public environment variables.

If a build reports `NEXT_PUBLIC_SITE_URL must be a public HTTPS origin`, ensure system environment variables are exposed, or copy the address from **Project → Settings → Domains** into both public URL variables with `https://`. Do not use `localhost`, a guessed domain, or a URL ending in `/signin`. `AUTH_ISSUER` is deliberately never inferred or rewritten. Keep its exact existing value in Convex and Vercel. The default `deploy:build` does not use the deploy key; `deploy:full` requires a production key when building for Vercel Production.

### Production smoke tests

- Public homepage, category, guide, review and comparison pages render on mobile and desktop.
- Google login returns to the correct host; profile persists; logout works.
- A normal reader cannot open admin routes or invoke admin mutations.
- Two readers have isolated reading lists.
- Drafts stay absent from public routes, search, metadata and sitemap.
- Create/edit/publish/archive a test record and delete/reassign a test category.
- Submit a real consented test newsletter and contact message, inspect records, and test unsubscribe.
- Verify an owned affiliate destination without creating automated traffic.
- Check missing links, error states, security headers, source dates, image permissions and keyboard navigation.
- Confirm production points to the production Convex deployment.

For rollback, redeploy a known-good Vercel commit and matching Convex function version. Use backward-compatible schema changes so old frontend code can still work. Back up data before destructive migrations; reverting frontend code does not restore deleted database records.

If Google reports `redirect_uri_mismatch`, compare the callback host/path exactly. If Convex reports unauthenticated, check issuer, audience (`shopwithabhi`), public/private key pair and `kid`, and deployment environment. If forms fail, compare gateway secrets and public origin. If fonts fail during build, allow outbound access to Google font assets or replace them with locally licensed font files.

## Checks and project layout

```powershell
npm run lint
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

Playwright covers the public site using Chromium for desktop and mobile emulation, not real Safari. It reads local configuration and checks the appropriate configured/unconfigured authentication and form states. Configured form tests use validation and rejected origins without writing messages or subscribers to the live database. It can reuse a local server on port 3000. Backend tests use `convex-test` with isolated identities and do not require a cloud deployment.

To run browser checks against the production build on a separate port:

```powershell
npm run build
$env:E2E_PRODUCTION = "true"
npm run test:e2e
Remove-Item Env:E2E_PRODUCTION
```

This starts and stops its own production server on port 3001. Tests cover header/hero search, the mobile search dialog, Escape/focus restoration, category and mobile menus, useful empty-content states, reduced motion, image loading, horizontal overflow, protected-page redirects, forms, metadata and sitemap.

```text
src/app/             Public routes, server guards, API gateways, SEO routes
src/components/      Public UI, editor, dashboards, forms, motion
src/config/          Business, navigation, legal and affiliate defaults
src/lib/             Authentication, JWT bridge, data, sanitization, validation
convex/              Typed schema, queries, mutations, authorization, cron
scripts/             Signing key generation and production env validation
tests/               Backend/unit tests and browser smoke tests
```

Sitemap generation is bounded at 20,000 content records. Split it into sitemap shards before exceeding that limit. No custom backend server, MySQL, Prisma, or second database is used.

At implementation time, npm reported five **development-tool transitive** advisories in the Next ESLint plugin → fast-glob → micromatch → braces chain. The suggested automated fix downgrades the Next lint configuration incompatibly, so it was not applied blindly. Recheck with `npm audit` and update when a compatible fix exists; `npm audit --omit=dev` reported zero vulnerabilities.

## Pre-launch owner checklist

- [ ] Configure and verify Google, production Convex and Vercel.
- [ ] Add the actual business/contact details, domain, branding and social profiles.
- [ ] Review and finalize all legal and editorial policies.
- [ ] Confirm Amazon Associates participation, marketplace requirements, and disclosure wording/placement.
- [ ] Add real permitted images, verified product sources, review criteria and verification dates.
- [ ] Enter real affiliate links; remove all placeholder values.
- [ ] Make no claims of hands-on testing unless supported by actual testing.
- [ ] Keep prices/availability absent unless an authorized, compliant source is added.
- [ ] Review retention, consent and any enabled click analytics.
- [ ] Complete live authenticated smoke tests; configure email delivery before promising newsletters.
- [ ] Recheck dependency advisories, backups, production logs and rollback procedure.

## Integration references

- [Next.js installation and App Router](https://nextjs.org/docs/app/getting-started/installation)
- [NextAuth v4 options](https://next-auth.js.org/configuration/options)
- [Auth.js integration/version status](https://authjs.dev/getting-started/integrations)
- [Convex custom JWT provider](https://docs.convex.dev/auth/advanced/custom-jwt)
- [Convex on Vercel](https://docs.convex.dev/production/hosting/vercel)

The JWT bridge is an application-owned integration built on those documented APIs, not an official drop-in NextAuth adapter. This distinction matters when maintaining or upgrading authentication.

## Verification completed

- ESLint passed; TypeScript and production builds passed.
- 45 backend/unit tests passed, covering deployment URL resolution, existing-backend builds, stable issuer preservation and preflight checks, authorization, role-aware account controls, raw/normalized verified-email claims, profile preference saves, dashboard guards, publication privacy, data integrity, forms, redirects, sanitization and safe repeatable category initialization.
- 22 browser checks passed against the configured production build, covering login/signup/admin entry points, navigation, header/hero search, mobile dialogs, empty-content states, image loading, reduced motion, protected routes, form validation, anonymous token access, metadata, sitemap, and layouts from 320px to 1440px.
- Desktop and mobile homepage screenshots were visually inspected; the editorial images loaded successfully.
- The configured Convex development deployment's settings, categories and content list functions were verified live. A read-only signed-token probe also confirmed that the deployment accepts the configured signing key and issuer. Google OAuth consent/login, authenticated dashboard browser flows and Vercel deployment remain unverified.
- On this Windows host, a stale Turbopack CSS-worker cache caused one build failure; removing only generated `.next/build` and `.next/cache` files restored a successful clean build.
