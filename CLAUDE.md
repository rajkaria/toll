# Toll — Project Context

## Session Context (Last updated: 2026-04-11 12:00)

### Current State
- **npm packages published** and live on npm registry:
  - `@rajkaria123/toll-stellar@0.1.0`
  - `@rajkaria123/toll-gateway@0.1.0`
  - `@rajkaria123/toll-sdk@0.1.0`
  - `@rajkaria123/toll-cli@0.1.0`
- **All source code updated** from `@toll/*` to `@rajkaria123/toll-*` across the entire monorepo
- **Docs, README, landing page, snippets** all updated with correct published package names
- **Landing page verified** rendering correctly with new package names
- **Changes are NOT committed** — 27 modified files need to be committed and pushed
- **Dashboard deployed** on Vercel at tollpay.xyz (Root Directory must be set to `apps/dashboard`)

### Recent Changes (uncommitted)
- `packages/stellar/package.json` — renamed to `@rajkaria123/toll-stellar`
- `packages/gateway/package.json` — renamed to `@rajkaria123/toll-gateway`, updated deps
- `packages/sdk/package.json` — renamed to `@rajkaria123/toll-sdk`
- `packages/cli/package.json` — renamed to `@rajkaria123/toll-cli`
- `packages/contracts/package.json` — renamed to `@rajkaria123/toll-contracts`
- `packages/gateway/src/*.ts` (11 files) — all `@toll/stellar` imports → `@rajkaria123/toll-stellar`
- `packages/gateway/tsup.config.ts` — updated external reference
- `apps/demo-server/package.json` — updated deps
- `apps/demo-server/src/index.ts` — updated import
- `scripts/package.json` — updated deps
- `apps/dashboard/src/lib/snippets.ts` — all code snippets updated
- `apps/dashboard/src/app/page.tsx` — CTA install command updated
- `apps/dashboard/src/app/docs/page.tsx` — install instructions updated
- `README.md` — package table and install commands updated
- `pnpm-lock.yaml` — regenerated

### Next Steps
1. **Commit and push** all the package renaming changes (27 files)
2. **Revoke the npm token** that was shared in chat and generate a new one
3. **Create mainnet Stellar wallet** — fund with XLM, add USDC trustline
4. **Update `payTo`** in `apps/demo-server/toll.config.json` with mainnet Stellar address
5. **Deploy demo server** publicly at api.tollpay.xyz
6. **Verify Vercel deployment** — ensure Root Directory is `apps/dashboard`
7. **Record 60-second demo video** (user should do personally)

### Key Decisions
- **Package scope**: Chose `@rajkaria123/toll-*` over `@tollpay/*` — user already had the org, faster path
- **Workspace refs preserved**: Local dev still uses `workspace:*` for cross-package deps
- **Contracts package renamed** but not published (Soroban smart contracts, not needed for hackathon)
- **Positioning**: "Stripe for MCP Servers" — middleware renamed to paywall throughout

### Previous Session Notes
- Design spec written at `docs/superpowers/specs/2026-04-11-toll-mainnet-reposition-design.md`
- Landing page rewritten with production messaging
- Dashboard page with earnings/transactions UI
- Demo page with mock data
- Docs page with integration guide
- README rewritten from developer POV
- April 13 hackathon deadline (Stellar x402/MPP track)
