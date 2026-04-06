import { describe, it, expect } from "vitest"
import { TollClient } from "./client.js"

describe("TollClient", () => {
  it("constructs with config", () => {
    const client = new TollClient({ serverUrl: "http://localhost:3002" })
    expect(client).toBeDefined()
  })

  it("tracks spending", () => {
    const client = new TollClient({ serverUrl: "http://localhost:3002", budget: { maxDaily: "5.00" } })
    const report = client.getSpending()
    expect(report.totalSpent).toBe(0)
    expect(report.callCount).toBe(0)
    expect(report.dailyBudget).toBe(5)
  })

  it("registers event handlers", () => {
    const client = new TollClient({ serverUrl: "http://localhost:3002" })
    const events: string[] = []
    client.on((event) => events.push(event))
    expect(events).toHaveLength(0) // no events yet
  })
})
