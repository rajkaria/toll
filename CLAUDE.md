# Toll — Project Context

## Session Context (Last updated: 2026-04-11 17:00)

### Current State
- **Everything is LIVE and functional on Stellar mainnet**
- **Demo server deployed** on Railway at `api.tollpay.xyz` (custom domain verified)
  - Railway project: `3232a9dc-63f9-40c8-b8b2-c4295989c8e2`
  - Service: `toll-demo-server`
  - Docker-based deployment (node:20-slim, pnpm monorepo build)
- **Dashboard deployed** on Vercel at `tollpay.xyz` (Root Directory = `apps/dashboard`)
- **Stellar wallet funded** on mainnet:
  - Address: `GDQRUDNV3D3DF3KMVPWHFW7Y676AEPL7U6CEXKCD2F7HLEPFF5HKOEUV`
  - Balance: 17.32 XLM + 1.53 USDC
- **x402 payment flow verified**:
  - Free tool (health_check) returns 200
  - Paid tool (search_competitors) returns HTTP 402 with proper x402 v2 spec response
  - Includes: `stellar:pubnet`, USDC asset contract, payTo address, facilitator URL
- **npm packages published**: `@rajkaria123/toll-gateway`, `toll-stellar`, `toll-sdk`, `toll-cli` (all 0.1.0)
- **All fake data removed** — landing page shows real tool pricing, dashboard shows empty state (populates with real earnings)
- **All testnet references fixed** to mainnet

### Recent Changes (this session)
- `apps/demo-server/toll.config.json` — updated `payTo` to funded mainnet address
- `apps/demo-server/src/tools/search.ts`, `sentiment.ts`, `compare.ts` — "Stellar Testnet" → "Stellar Mainnet"
- `apps/demo-server/src/index.ts` — added CORS middleware, network field in /health
- `apps/demo-server/Dockerfile` — new, multi-stage Docker build for Railway
- `railway.toml` (root) — Railway deployment config with healthcheck
- `apps/dashboard/src/app/page.tsx` — replaced fake earnings with honest pricing preview
- `apps/dashboard/src/app/api/earnings/route.ts` — replaced fake demo data with empty state
- `apps/dashboard/src/lib/snippets.ts` — URLs updated to api.tollpay.xyz
- `README.md` — URLs updated, fake tx references removed

### Git Commits (this session)
- `8ff9168` renaming npm packages
- `19a429b` fix: remove fake data, add deployment config, fix testnet refs
- `6926663` add root railway.toml for Railway deployment
- `9001588` fix: include tsconfig.base.json in Docker build
- `9d6a255` fix: update all URLs to live Railway deployment
- `3e5cdb7` update payTo to funded Stellar mainnet address
- `7f9f61c` update URLs to api.tollpay.xyz custom domain (now live)

### Next Steps
1. **Record 60-second demo video** showing the 402 flow live (user should do personally)
2. **Submit to hackathon** — April 13 deadline (Stellar x402/MPP track)
3. **Test full end-to-end paid transaction** — need an agent with funded Stellar wallet + x402 SDK to actually pay USDC and execute a paid tool
4. **Optional**: Add real-time earnings to dashboard (currently shows empty state on Vercel since SQLite is on Railway)

### Key Decisions
- **Package scope**: `@rajkaria123/toll-*` — user's existing npm org
- **Hosting split**: Railway (demo server + SQLite) / Vercel (Next.js dashboard)
- **Positioning**: "Stripe for MCP Servers" — middleware paywall for MCP tool calls
- **Honest demo**: No fake data — shows real pricing and empty earnings state until real payments flow
- **x402 facilitator**: OpenZeppelin (`channels.openzeppelin.com/x402`) for payment settlement

### Previous Session Notes
- npm packages published to registry (all 0.1.0)
- Source code updated from `@toll/*` to `@rajkaria123/toll-*` across monorepo
- Design spec at `docs/superpowers/specs/2026-04-11-toll-mainnet-reposition-design.md`
- Landing page rewritten with production messaging
- Dashboard, demo, docs pages all built
- README rewritten from developer POV
