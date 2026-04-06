import { createHmac, randomUUID } from "node:crypto"

export type WebhookEvent =
  | "payment.received"
  | "payment.failed"
  | "policy.violation"
  | "tool.called"
  | "session.created"
  | "budget.exhausted"

export interface WebhookEndpoint {
  url: string
  events: WebhookEvent[]
  secret?: string
}

export interface WebhookConfig {
  endpoints?: WebhookEndpoint[]
}

export class WebhookDispatcher {
  private endpoints: WebhookEndpoint[]

  constructor(config?: WebhookConfig) {
    this.endpoints = config?.endpoints ?? []
  }

  /** Dispatch a webhook event to all matching endpoints (fire-and-forget) */
  dispatch(event: WebhookEvent, payload: Record<string, unknown>): void {
    const matching = this.endpoints.filter((ep) => ep.events.includes(event))
    for (const ep of matching) {
      this.send(ep, event, payload).catch(() => {
        // Swallow errors — webhooks are best-effort
      })
    }
  }

  private async send(
    endpoint: WebhookEndpoint,
    event: WebhookEvent,
    payload: Record<string, unknown>,
    attempt = 1
  ): Promise<void> {
    const deliveryId = randomUUID()
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const body = JSON.stringify({ event, payload, timestamp, deliveryId })

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Toll-Event": event,
      "X-Toll-Timestamp": timestamp,
      "X-Toll-Delivery-Id": deliveryId,
    }

    if (endpoint.secret) {
      headers["X-Toll-Signature"] = createHmac("sha256", endpoint.secret)
        .update(body)
        .digest("hex")
    }

    try {
      const resp = await fetch(endpoint.url, {
        method: "POST",
        headers,
        body,
        signal: AbortSignal.timeout(5000),
      })

      if (!resp.ok && attempt < 3) {
        // Retry with exponential backoff
        await new Promise((r) => setTimeout(r, attempt * 1000))
        return this.send(endpoint, event, payload, attempt + 1)
      }
    } catch {
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, attempt * 1000))
        return this.send(endpoint, event, payload, attempt + 1)
      }
    }
  }
}
