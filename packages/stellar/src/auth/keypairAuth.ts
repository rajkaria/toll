import { Keypair } from "@stellar/stellar-sdk"
import { randomBytes, createHmac } from "node:crypto"

export interface AuthConfig {
  requireStellarAuth?: boolean
  challengeTtlSeconds?: number // default 300
}

interface Challenge {
  nonce: string
  publicKey: string
  expiresAt: number
}

interface AuthToken {
  sub: string // public key
  iat: number
  exp: number
}

export class KeypairAuth {
  private challenges = new Map<string, Challenge>()
  private ttl: number
  private serverSecret: string

  constructor(config?: AuthConfig, serverSecret?: string) {
    this.ttl = (config?.challengeTtlSeconds ?? 300) * 1000
    this.serverSecret = serverSecret ?? process.env.TOLL_SERVER_SECRET ?? "toll-default-secret"
  }

  /** Generate a challenge for a public key */
  createChallenge(publicKey: string): { challenge: string; expiresAt: number } {
    // Validate the public key
    try { Keypair.fromPublicKey(publicKey) } catch {
      throw new Error("Invalid Stellar public key")
    }

    const nonce = randomBytes(32).toString("hex")
    const expiresAt = Date.now() + this.ttl

    this.challenges.set(nonce, { nonce, publicKey, expiresAt })
    this.cleanup()

    return { challenge: nonce, expiresAt }
  }

  /** Verify a signed challenge and issue a token */
  verify(publicKey: string, challenge: string, signature: string): { token: string; expiresAt: number } {
    const stored = this.challenges.get(challenge)

    if (!stored) throw new Error("Challenge not found or expired")
    if (stored.publicKey !== publicKey) throw new Error("Public key mismatch")
    if (Date.now() > stored.expiresAt) {
      this.challenges.delete(challenge)
      throw new Error("Challenge expired")
    }

    // Verify the signature
    const kp = Keypair.fromPublicKey(publicKey)
    const messageBuffer = Buffer.from(challenge, "hex")
    const sigBuffer = Buffer.from(signature, "base64")

    if (!kp.verify(messageBuffer, sigBuffer)) {
      throw new Error("Invalid signature")
    }

    // Consume the challenge
    this.challenges.delete(challenge)

    // Issue token
    const iat = Math.floor(Date.now() / 1000)
    const exp = iat + 3600 // 1 hour
    const payload: AuthToken = { sub: publicKey, iat, exp }
    const token = this.signToken(payload)

    return { token, expiresAt: exp * 1000 }
  }

  /** Validate a bearer token */
  validateToken(token: string): AuthToken | null {
    try {
      const [payloadB64, sig] = token.split(".")
      if (!payloadB64 || !sig) return null

      const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString()) as AuthToken
      const expectedSig = createHmac("sha256", this.serverSecret).update(payloadB64).digest("base64url")

      if (sig !== expectedSig) return null
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null

      return payload
    } catch {
      return null
    }
  }

  private signToken(payload: AuthToken): string {
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url")
    const sig = createHmac("sha256", this.serverSecret).update(payloadB64).digest("base64url")
    return `${payloadB64}.${sig}`
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [nonce, ch] of this.challenges) {
      if (now > ch.expiresAt) this.challenges.delete(nonce)
    }
  }
}
