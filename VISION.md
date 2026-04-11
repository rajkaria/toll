# Toll: Product Vision

**The Stripe for MCP Servers — Monetize any AI tool with one line of code, settled in USDC on Stellar.**

---

## What We Built (Hackathon Scope)

Toll is a drop-in npm middleware that turns any MCP server into a paid API. A developer runs `npm install @rajkaria123/toll-gateway`, adds three lines of configuration, and every tool call is gated behind a micropayment — settled in USDC on Stellar mainnet via the x402 and MPP payment protocols. No wallet setup, no blockchain code, no payment infrastructure. Just tools that earn money.

This is not a testnet demo. Toll is live at [api.tollpay.xyz](https://api.tollpay.xyz), processing real USDC on Stellar mainnet with sub-second finality. The 402 payment flow, the facilitator settlement, the developer dashboard — all production.

---

## The Opportunity

There are over 10,000 MCP servers today. They power code generation, data analysis, web search, document processing, and hundreds of other capabilities that AI agents rely on. Not a single one has a monetization layer.

This is the app store moment for AI. In 2008, developers built mobile apps but had no way to charge for them until Apple built the payment infrastructure. The MCP ecosystem is in that same moment right now — thousands of developers building powerful tools, zero infrastructure to get paid.

But this time, the buyers are not humans. They are AI agents. Autonomous software that discovers tools, evaluates them, and executes multi-step workflows without human intervention. These agents are becoming economic actors. They need to find services, negotiate prices, and settle payments — programmatically, instantly, at scale.

The agent economy will be larger than the app economy. And it needs its Stripe.

Stellar is the only network that can serve as the payment rail for this economy. Sub-second finality means an agent does not wait. Near-zero fees mean a $0.001 tool call is economically viable. USDC on Stellar means global settlement without volatility. These are not features — they are requirements. And only Stellar meets all of them.

---

## What Toll Becomes

### Month 1: Developer Adoption

`npm install @rajkaria123/toll-gateway` reaches 1,000 weekly downloads. The first 50 MCP server developers integrate Toll and start earning USDC for every tool call their servers handle.

The developer experience is everything. Toll ships comprehensive documentation, a CLI for local testing (`toll dev`), starter templates for common tool patterns, and a dashboard that shows earnings in real time. A developer goes from zero to earning in under five minutes.

The Toll Registry launches — a public directory of paid MCP tools. Agents query the registry to discover what tools are available, what they cost, and how to pay. This is the first time an AI agent can autonomously find and purchase a capability it needs.

### Month 3: The Toll Network

The Toll Marketplace goes live — not just a registry, but a full marketplace where developers list tools, set pricing, and agents browse, compare, and transact. Think npm registry, but every package has a price and every install is a payment.

Cross-server analytics give developers visibility into how agents use their tools. Which tools get called most. Which agents are the highest-value customers. Where demand is growing. This data is unique to Toll — no one else sits at the intersection of every agent-to-tool transaction.

Dynamic pricing arrives. Tools price themselves based on demand, time of day, and compute cost. An agent needing real-time financial data during market hours pays a premium. The same query at midnight costs less. The market sets the price, Toll settles the payment, Stellar clears the transaction.

Toll becomes the discovery layer for the agent economy. Agents do not browse the web for tools. They query Toll.

### Month 6: The Agent Economy on Stellar

Over 1,000 MCP servers are monetized through Toll. Monthly micropayment volume through Stellar exceeds $1M. Every dollar is a USDC transaction on the Stellar network — real volume, real utility, real demand for the network.

Agent-to-agent payments unlock the next tier. An orchestration agent hires a research agent, which hires a data-extraction agent, which calls three specialized tools. The entire chain settles on Stellar through Toll. Multi-hop economic activity, fully autonomous, fully settled.

The Toll Protocol launches as an open standard. Tool monetization should not be locked to one company's middleware. Toll publishes the specification for how agents discover, negotiate, and pay for tools. Other implementations can emerge. The protocol is open. The network effects accrue to Stellar.

Every dollar flowing through Toll is a dollar flowing through Stellar.

### Year 1: Stellar Becomes THE AI Payment Rail

Toll processes over 10 million micropayments per month on Stellar. The network handles more USDC micropayment volume than any other chain — not because of marketing, but because the tooling made it the default.

Enterprise API providers adopt Toll. Weather data, financial analytics, legal research, medical databases — services that charge $10,000/month for API access today can now offer per-call pricing to AI agents. A single legal research query costs $0.50 instead of a monthly subscription. The market expands by 100x because the pricing model finally matches the usage pattern.

AI companies choose Stellar specifically because Toll exists. When an AI startup evaluates which blockchain to build payment infrastructure on, the answer is Stellar — not because of the network's technical specs, but because Toll already solved the hardest part. The middleware is there. The marketplace is there. The agents are there. The volume is there.

The Toll DAO launches for protocol governance. Fee structures, marketplace policies, protocol upgrades — decided by the developers and agents who use the network.

---

## Why Each Integration Deepens Over Time

### Stellar

| Phase | Integration |
|---|---|
| **Hackathon** | USDC settlement on mainnet via x402 + MPP. Real payments, real finality. |
| **Month 3** | Multi-asset support — XLM, EURC, and other Stellar assets. Stellar Anchors integrated for fiat on/off ramp so developers withdraw earnings to their bank accounts. |
| **Month 6** | Toll becomes a Stellar Anchor itself, processing the highest volume of USDC micropayments on the network. Toll's transaction data becomes a public good for the Stellar ecosystem. |
| **Year 1** | Stellar Foundation partnership. Toll is the recommended monetization layer in Stellar's official MCP and agent developer documentation. New developers building on Stellar start with Toll. |

### x402 Protocol (Coinbase)

| Phase | Integration |
|---|---|
| **Hackathon** | Per-request HTTP 402 payment for individual tool calls. The protocol works exactly as designed. |
| **Month 3** | Streaming payments for long-running tools — real-time data feeds, continuous monitoring, live analytics. Payment flows as the data flows. |
| **Month 6** | x402 standard enhancement proposals informed by Toll's production data. Toll has processed millions of 402 transactions — that data shapes the next version of the protocol. |

### MPP (Stripe)

| Phase | Integration |
|---|---|
| **Hackathon** | Session-based payments for bulk tool access. Agents purchase a session and call multiple tools within it. |
| **Month 3** | Subscription-style agent access. Monthly plans for tool bundles. An agent pays $50/month for unlimited access to a suite of research tools. |
| **Month 6** | Enterprise billing integration. Invoicing, receipts, compliance, audit trails. Everything a Fortune 500 company needs to let their AI agents spend money. |

---

## Why Developers Choose Stellar Because of Toll

Developers do not choose payment rails. They choose developer tools.

No MCP server developer wakes up and says, "I want to settle payments on Stellar." They say, "I want to get paid when agents use my tools." If the best tool for that job runs on Stellar, then Stellar wins. Not through advocacy — through utility.

Toll removes every layer of blockchain complexity. A developer using Toll does not configure a wallet. Does not sign transactions. Does not understand Stellar's consensus protocol or asset issuance. Does not manage keys. Does not think about finality or fees.

They run:

```bash
npm install @rajkaria123/toll-gateway
```

They add to their MCP server:

```typescript
import { tollMiddleware } from '@rajkaria123/toll-gateway';

app.use("/mcp", tollMiddleware({
  payTo: "G...YOUR_STELLAR_ADDRESS",
  tools: {
    search_competitors: { price: "0.10" },
    analyze_sentiment: { price: "0.05" },
  }
}))
```

They deploy. They earn USDC. That USDC settles on Stellar.

The monetary layer is Stellar. The developer experience is Toll. Together, they make agent monetization as simple as adding a Stripe checkout. And just like Stripe made developers accidentally choose the traditional payment system, Toll makes developers accidentally choose Stellar.

That is how a blockchain wins. Not by convincing developers to care about the chain. By building the tool they already need, and running it on the right rail.

---

## Revenue Model

| Tier | Pricing | Who It Serves |
|---|---|---|
| **Free** | First $100/month in tool revenue — zero fees | Solo developers, experimentation, early adoption |
| **Growth** | 2.9% + $0.01 per paid tool call | Established tool developers with real agent traffic |
| **Enterprise** | Volume discounts, custom contracts, SLA guarantees | API providers, data companies, large-scale deployments |

The pricing mirrors Stripe intentionally. Developers already understand this model. It is familiar, fair, and proven at scale.

**Unit economics at scale:**
- At $100K monthly volume: ~$2,900 MRR for Toll
- At $1M monthly volume: ~$29,000 MRR for Toll
- At $10M monthly volume: ~$290,000 MRR for Toll

Every dollar of Toll revenue represents ~$34 of micropayment volume flowing through Stellar.

---

## What the Hackathon Validated

Four critical hypotheses, all confirmed in production:

1. **The x402 + MPP integration works on Stellar mainnet.** Not in theory. Not on testnet. In production, with real USDC, with real settlement, with real finality.

2. **MCP tool calls map 1:1 to micropayment events.** Every tool invocation is a discrete, billable unit. The MCP protocol's request-response pattern is a natural fit for per-call payments. No architectural gymnastics required.

3. **The middleware pattern is the right developer experience.** Drop-in integration. Zero changes to existing tool logic. A developer wraps their MCP server with Toll and monetization is live. This is how Stripe won — by being the thing you add, not the thing you rewrite around.

4. **Stellar is the right rail.** Sub-second finality means the agent gets its response without waiting for block confirmations. Fees measured in fractions of a cent mean a $0.001 tool call is profitable. USDC means no volatility. The choice was validated by building it.

---

## The Ask

**From the Stellar Foundation:**

- **Grant funding** to support full-time Toll development for six months — marketplace, dynamic pricing, Anchor integration, and the open protocol specification.

- **Featured placement** in Stellar developer documentation. When a developer searches "how to monetize MCP tools on Stellar," Toll is the first answer.

- **Beta program access** to 50 MCP server developers from the Stellar ecosystem to validate marketplace mechanics and drive initial transaction volume.

- **Enterprise introductions** to API providers and data companies exploring agent-based distribution. Toll is the bridge between their existing services and the agent economy.

---

## The Inevitable Outcome

AI agents will pay for tools. This is not a prediction — it is already happening. The only question is which payment rail captures that volume.

Stellar has every technical advantage: speed, cost, stability, global reach. What it needs is the developer tool that converts those advantages into adoption. Toll is that tool.

We are not building a hackathon project. We are building the payment infrastructure for the agent economy. And we are building it on Stellar.

---

*Toll is live today at [tollpay.xyz](https://tollpay.xyz). The demo server runs at [api.tollpay.xyz](https://api.tollpay.xyz). The code is open source. The payments are real.*
