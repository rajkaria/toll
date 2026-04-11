# Toll — Mainnet Repositioning & Winning Brief

**Date:** 2026-04-11
**Deadline:** April 13 (Stellar x402/MPP track)
**Approach:** B + C (mainnet tx with explorer links + judge-accessible endpoint)

## Core Repositioning

- **Old:** "The agent revenue protocol for Stellar" — infrastructure-for-infrastructure
- **New:** "The Stripe for MCP servers" — protagonist is the indie dev who wants to get paid
- **Visual metaphor:** Toll booths — calls are cars, paywall is the gate, meter is USDC

## Changes

### 1. Mainnet Switch (config only)
- `toll.config.json`: network → mainnet, facilitatorUrl → `https://channels.openzeppelin.com/x402`, payTo → mainnet wallet
- Environment vars: mainnet keypair
- USDC SAC mainnet address already in code

### 2. Landing Page (tollpay.xyz)
- Above fold: headline, subline, 3-line snippet, GIF placeholder, earnings mock
- Below fold: toll booth "how it works", "try it yourself" with live endpoint, explorer link
- Cut: primitives, packages grid, 12-feature grid, differentiation table, protocol comparison, stats box

### 3. Dashboard
- Earnings summary: "$X earned this week across N tools"
- Payout button (links to stellar.expert for payTo address)
- Each tx row → stellar.expert/explorer/public/tx/{hash}

### 4. README
- Developer-first: "You built an MCP server. Here's how to get paid."
- 3-line snippet first, Watchdog example, cut 30-feature list

### 5. Terminology Sweep
- middleware → paywall (user-facing only)
- monetization layer/gateway → paywall
- agent revenue protocol → Stripe for MCP servers

### 6. Judge Access (Approach C)
- MCP client config snippet on landing page pointing to api.tollpay.xyz/mcp
- Free health_check for unfunded wallets
- Last N mainnet txs shown as proof

### 7. Deployment
- Demo server → public HTTPS (Railway/Fly.io) at api.tollpay.xyz
- Dashboard → Vercel at tollpay.xyz
