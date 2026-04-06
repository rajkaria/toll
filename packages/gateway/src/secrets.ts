/**
 * SecretsManager — supports dual-key rotation without downtime.
 * During rotation, both current and previous keys are accepted.
 */

export interface SecretsConfig {
  rotationIntervalDays?: number
  previousKeys?: string[]
}

export class SecretsManager {
  private currentKey: string
  private previousKeys: string[]
  private rotatedAt: number

  constructor(currentKey: string, config?: SecretsConfig) {
    this.currentKey = currentKey
    this.previousKeys = config?.previousKeys ?? []
    this.rotatedAt = Date.now()
  }

  /** Get the current active key */
  getCurrent(): string {
    return this.currentKey
  }

  /** Validate a key against current + previous (grace period) */
  validate(key: string): boolean {
    if (key === this.currentKey) return true
    return this.previousKeys.includes(key)
  }

  /** Rotate to a new key, moving current to previous */
  rotate(newKey: string): void {
    this.previousKeys.unshift(this.currentKey)
    // Keep at most 2 previous keys
    if (this.previousKeys.length > 2) this.previousKeys.pop()
    this.currentKey = newKey
    this.rotatedAt = Date.now()
  }

  /** Get rotation status */
  status(): { currentKeyAge: number; previousKeyCount: number; lastRotated: string } {
    return {
      currentKeyAge: Math.floor((Date.now() - this.rotatedAt) / 86400000),
      previousKeyCount: this.previousKeys.length,
      lastRotated: new Date(this.rotatedAt).toISOString(),
    }
  }
}
