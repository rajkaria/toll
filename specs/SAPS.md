# SAPS: Stellar Agent Payment Standard

**Version:** 0.1.0-draft
**Authors:** Toll Contributors
**Status:** Draft
**Created:** 2026-04-06

## Abstract

SAPS defines a standard protocol for AI agents to discover, negotiate, authenticate, pay for, and consume MCP (Model Context Protocol) tool services on the Stellar network. It combines x402 (HTTP 402 payment), MPP (Machine Payments Protocol), Stellar keypair authentication, and Soroban smart contracts into a cohesive framework.

## Motivation

AI agents increasingly need to call external tools — but there is no standard for how an agent discovers available tools, negotiates pricing, proves its identity, pays for execution, and verifies receipts. Each MCP server invents its own payment flow, creating fragmentation.

SAPS provides a single specification that any MCP server and any AI agent can implement for interoperable, trustless payments on Stellar.

## Protocol Overview

### Flow

```
1. DISCOVER: Agent fetches /registry/manifest to find tools + prices
2. AUTHENTICATE: Agent obtains auth token via /auth (SEP-10 or keypair challenge)
3. NEGOTIATE (optional): Agent proposes price via /negotiate
4. CALL: Agent sends tools/call to /mcp
5. PAY: Server returns 402 with x402 or MPP challenge
6. SETTLE: Agent signs Stellar transaction, retries with proof
7. VERIFY: Server settles via facilitator or Soroban contract
8. RECEIPT: Server returns tool result + payment receipt headers
```

### Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | /registry/manifest | Tool catalog + server info |
| GET | /health | Liveness probe |
| GET | /health/ready | Readiness probe |
| GET | /health/tools | Tool list with pricing |
| POST | /cost | Cost estimation |
| GET | /auth/challenge | Authentication challenge |
| POST | /auth/verify | Token exchange |
| POST | /negotiate | Price negotiation |
| POST | /mcp | MCP tool call (JSON-RPC) |
| GET | /metrics | Prometheus metrics |
| GET | /invoice/:txId | Invoice for transaction |
| GET | /receipt/:txId | Payment receipt |
| POST | /session/create | Pre-funded session |
| GET | /session/status | Session balance |

### Payment Methods

**x402 (per-call):** HTTP 402 → PaymentRequired JSON → agent signs Stellar tx → payment-signature header → facilitator settlement → tool executes.

**MPP (session-based):** HTTP 402 → WWW-Authenticate: Payment → agent opens payment channel → Authorization: Payment header → mppx verification → tool executes.

**Soroban Escrow (high-value):** For calls above a threshold, payment goes to an escrow contract. Agent has a dispute window. Auto-release on timeout.

### Authentication

SAPS supports two auth methods:
1. **SEP-10** — Standard Stellar Web Authentication
2. **Keypair Challenge** — Lightweight alternative for agents without full SEP-10 support

### Pricing Models

- **Static:** Fixed price per call
- **Tiered:** Price decreases with volume
- **Dynamic:** Price varies with time, demand, or input
- **Negotiated:** Agent proposes price, server accepts/counters
- **Bundled:** Pre-purchase call packs
- **Subscription:** Monthly plans with call quotas

### Security Requirements

- Replay protection on payment signatures (5-min TTL minimum)
- Transaction hash idempotency in earnings recording
- Spending policy enforcement before payment verification
- Input sanitization on tool arguments
- Tamper-evident audit log with hash chain
- Rate limiting on 402 responses (anti-enumeration)

### Configuration

Servers expose their configuration via the manifest endpoint. The canonical config format:

```json
{
  "network": "testnet",
  "payTo": "G...",
  "facilitatorUrl": "https://x402.org/facilitator",
  "defaultPaymentMode": "x402",
  "tools": { "name": { "price": "0.01", "currency": "USDC" } },
  "spendingPolicy": { "maxPerCall": "1.00", "maxDailyPerCaller": "10.00" }
}
```

## Reference Implementation

The reference implementation is [Toll](https://github.com/rajkaria/toll), deployed at [tollpay.xyz](https://tollpay.xyz).

## Packages

- `@toll/gateway` — Server-side middleware
- `@toll/stellar` — Payment verification + Stellar integration
- `@toll/sdk` — Agent-side client library
- `@toll/cli` — Developer CLI
- `@toll/contracts` — Soroban contract interfaces

## License

MIT
