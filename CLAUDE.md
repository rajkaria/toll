# Toll — Project Context

## Session Context (Last updated: 2026-04-11 18:30)

### Current State
- **Everything LIVE on Stellar mainnet** — demo server at `api.tollpay.xyz`, dashboard at `tollpay.xyz`
- **6 new platform features built** (uncommitted, ready to push):
  - **Toll Wallet** — `WalletManager` in SDK auto-creates Stellar Ed25519 keypairs at `~/.toll/wallet.json`
  - **Toll Registry API** — 6 API routes on Supabase (`/api/registry/{challenge,register,discover,servers,heartbeat,metrics}`)
  - **Toll Proxy** — Express MCP proxy at `apps/proxy/` that auto-pays 402s with USDC on Stellar
  - **Registry Web UI** — `/registry` page with search, filter, quality badges, connect modal
  - **Quality Scores** — metrics collection at proxy + quality formula in registry
  - **Fiat On-Ramp** — `/fund` page with balance checker (hits Stellar Horizon mainnet), funding guide
- **Why Toll page** — `/why-toll` with benefits, use cases, payment flow, audience breakdown
- **Landing page updated** — "The Platform" section with 3 cards (Registry, Proxy, Why Toll)
- **Docs updated** — 3 new sections (Toll Proxy, Tool Registry, Wallet Management) with sidebar nav
- **Nav updated** — Why Toll, Registry, Dashboard, Fund, Docs
- **Supabase** — registry tables (`servers`, `tools`) on project `jmtzwjfzxjcxlgtdoumi`, demo data seeded
- **Vercel env vars set** — `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` configured
- **All builds pass** — 16 pages, SDK/CLI/Proxy all build clean
- **Balance API verified** — returns real mainnet balances (17.32 XLM + 1.53 USDC)

### Recent Changes (this session — UNCOMMITTED)
- `packages/sdk/src/wallet.ts` — NEW: WalletManager class
- `packages/sdk/src/payment.ts` — NEW: extracted signAndPay() for proxy reuse
- `packages/sdk/src/client.ts` — auto-wallet creation, getWalletAddress()
- `packages/sdk/src/types.ts` — TollWallet interface, autoCreateWallet config
- `packages/sdk/src/index.ts` — new exports
- `apps/proxy/` — NEW: entire proxy app (index, proxy, budget, metrics, types, Dockerfile, railway.toml)
- `apps/dashboard/src/app/api/registry/*/route.ts` — NEW: 6 registry API routes
- `apps/dashboard/src/app/api/stellar-balance/route.ts` — NEW: Horizon balance API
- `apps/dashboard/src/app/registry/page.tsx` — NEW: registry UI
- `apps/dashboard/src/app/fund/page.tsx` — NEW: fiat on-ramp page
- `apps/dashboard/src/app/why-toll/page.tsx` — NEW: benefits page
- `apps/dashboard/src/components/registry/` — NEW: ToolSearchCard, QualityBadge, ConnectModal
- `apps/dashboard/src/lib/supabase.ts` — NEW: Supabase admin client
- `apps/dashboard/src/lib/quality.ts` — NEW: quality score formula
- `apps/dashboard/src/app/page.tsx` — added Platform section, Proxy/Registry sections
- `apps/dashboard/src/app/docs/page.tsx` — 3 new doc sections + TOC entries
- `apps/dashboard/src/lib/snippets.ts` — PROXY/REGISTRY/WALLET snippets
- `apps/dashboard/src/components/shared/NavLinks.tsx` — updated nav links
- `packages/cli/src/commands/register.ts` — NEW: `toll register` command
- `packages/cli/src/index.ts` — added register command
- `packages/cli/package.json` — added @stellar/stellar-sdk dep
- `apps/dashboard/package.json` — added @supabase/supabase-js, @stellar/stellar-sdk
- `README.md` — added Proxy and Registry sections
- `CLAUDE.md` — session context

### Next Steps
1. **Commit and push** — all changes are uncommitted, `git push` triggers Vercel redeployment
2. **Deploy proxy** to Railway as separate service (optional: `proxy.tollpay.xyz`)
3. **Test the registry** — after deploy, verify `/api/registry/discover` returns seeded tools on production
4. **Record demo video** — show the full flow: registry discovery → proxy auto-pay → dashboard earnings
5. **Submit hackathon** — April 13 deadline
6. **Test end-to-end paid transaction** — fund agent wallet, proxy auto-pays, verify USDC moves
7. **Publish toll-proxy** to npm (`@rajkaria123/toll-proxy`)

### Key Decisions
- **Supabase for registry** — used existing project `jmtzwjfzxjcxlgtdoumi` (free tier limit reached, couldn't create new)
- **Stellar keypair auth** — registry registration authenticated via Ed25519 signature (no passwords)
- **Quality score formula** — 30% uptime + 30% success rate + 20% latency + 20% volume (log scale)
- **Proxy as separate app** — `apps/proxy/` not in gateway package, deployable independently
- **Nav simplified** — removed Demo, Tools, Protocols; added Why Toll, Registry, Fund
- **Why Toll page** — dedicated benefits page for hackathon judges and first-time visitors

### Previous Session Notes
- npm packages published to registry (all 0.1.0)
- Demo server deployed on Railway at `api.tollpay.xyz`
- Dashboard deployed on Vercel at `tollpay.xyz`
- Stellar wallet funded on mainnet (17.32 XLM + 1.53 USDC)
- x402 payment flow verified (402 with proper spec)
- Landing page, dashboard, docs, demo pages all built
- 25 gateway tests pass (9 middleware integration + 16 existing)
- MIT license added
- README rewritten from developer POV
- Design spec at `docs/superpowers/specs/2026-04-11-toll-mainnet-reposition-design.md`
