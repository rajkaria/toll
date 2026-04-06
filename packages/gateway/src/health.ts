import type { Router, Request, Response } from "express"
import type { TollConfig } from "@toll/stellar"

const startTime = Date.now()

export function createHealthRoutes(config: TollConfig): Router {
  // Use dynamic import to avoid requiring express as direct dep at module level
  const router = require("express").Router() as Router

  // GET /health — liveness probe
  router.get("/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      server: "Toll Gateway",
      version: "0.2.0",
      uptime: Math.floor((Date.now() - startTime) / 1000),
      network: config.network,
    })
  })

  // GET /health/ready — readiness probe
  router.get("/health/ready", (_req: Request, res: Response) => {
    const checks: Record<string, boolean> = {
      config: !!config.payTo && !!config.facilitatorUrl,
      tools: Object.keys(config.tools).length > 0,
    }
    const healthy = Object.values(checks).every(Boolean)
    res.status(healthy ? 200 : 503).json({ status: healthy ? "ready" : "not_ready", checks })
  })

  // GET /health/tools — tool catalog
  router.get("/health/tools", (_req: Request, res: Response) => {
    const tools = Object.entries(config.tools).map(([name, cfg]) => ({
      name,
      price: cfg.price,
      currency: cfg.currency,
      paymentMode: cfg.paymentMode ?? config.defaultPaymentMode,
      description: cfg.description ?? null,
      free: parseFloat(cfg.price) === 0,
    }))
    res.json({ tools, count: tools.length, network: config.network })
  })

  // POST /cost — cost estimation
  router.post("/cost", (req: Request, res: Response) => {
    const { tools: toolNames } = req.body as { tools?: string[] } || {}
    if (!Array.isArray(toolNames)) {
      res.status(400).json({ error: "Body must have 'tools' array" })
      return
    }
    const estimates = toolNames.map((name) => {
      const cfg = config.tools[name]
      if (!cfg) return { tool: name, price: null, error: "Unknown tool" }
      return {
        tool: name,
        price: cfg.price,
        currency: cfg.currency,
        paymentMode: cfg.paymentMode ?? config.defaultPaymentMode,
      }
    })
    const total = estimates.reduce((s, e) => s + (e.price ? parseFloat(e.price) : 0), 0)
    res.json({ estimates, total: total.toFixed(4), currency: "USDC" })
  })

  return router
}
