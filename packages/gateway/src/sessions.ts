import { createHmac, randomUUID } from "node:crypto"

export interface SessionConfig {
  enabled?: boolean
  tokenTtlMinutes?: number // default 60
  maxActivePerCaller?: number // default 5
}

export interface Session {
  sessionId: string
  callerId: string
  budget: number
  spent: number
  createdAt: number
  expiresAt: number
}

export class SessionManager {
  private sessions = new Map<string, Session>()
  private ttlMs: number
  private maxPerCaller: number
  private serverSecret: string

  constructor(config?: SessionConfig, serverSecret?: string) {
    this.ttlMs = (config?.tokenTtlMinutes ?? 60) * 60 * 1000
    this.maxPerCaller = config?.maxActivePerCaller ?? 5
    this.serverSecret = serverSecret ?? process.env.TOLL_SERVER_SECRET ?? "toll-session-secret"
  }

  /** Create a new pre-funded session */
  create(callerId: string, budget: number): { token: string; session: Session } {
    // Check max active sessions
    const active = [...this.sessions.values()].filter(
      (s) => s.callerId === callerId && s.expiresAt > Date.now()
    )
    if (active.length >= this.maxPerCaller) {
      throw new Error(`Max ${this.maxPerCaller} active sessions per caller`)
    }

    const sessionId = randomUUID()
    const now = Date.now()
    const session: Session = {
      sessionId,
      callerId,
      budget,
      spent: 0,
      createdAt: now,
      expiresAt: now + this.ttlMs,
    }

    this.sessions.set(sessionId, session)

    // Generate signed token
    const payload = Buffer.from(JSON.stringify({ sid: sessionId, sub: callerId, exp: session.expiresAt })).toString("base64url")
    const sig = createHmac("sha256", this.serverSecret).update(payload).digest("base64url")
    const token = `${payload}.${sig}`

    return { token, session }
  }

  /** Validate a session token and check budget */
  validate(token: string, amount: number): { valid: boolean; session?: Session; error?: string } {
    try {
      const [payload, sig] = token.split(".")
      if (!payload || !sig) return { valid: false, error: "Malformed token" }

      const expectedSig = createHmac("sha256", this.serverSecret).update(payload).digest("base64url")
      if (sig !== expectedSig) return { valid: false, error: "Invalid signature" }

      const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { sid: string; exp: number }
      if (data.exp < Date.now()) return { valid: false, error: "Session expired" }

      const session = this.sessions.get(data.sid)
      if (!session) return { valid: false, error: "Session not found" }

      const remaining = session.budget - session.spent
      if (remaining < amount) return { valid: false, error: `Insufficient balance: $${remaining.toFixed(4)} remaining` }

      return { valid: true, session }
    } catch {
      return { valid: false, error: "Token validation failed" }
    }
  }

  /** Deduct from session budget */
  deduct(sessionId: string, amount: number): void {
    const session = this.sessions.get(sessionId)
    if (session) session.spent += amount
  }

  /** Get session status */
  getStatus(sessionId: string): Session | null {
    const session = this.sessions.get(sessionId)
    if (!session || session.expiresAt < Date.now()) return null
    return session
  }
}
