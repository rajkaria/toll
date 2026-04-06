import { createHash, randomUUID } from "node:crypto"
import type BetterSqlite3 from "better-sqlite3"

export interface AuditEntry {
  seq: number
  id: string
  timestamp: string
  event: string
  data: Record<string, unknown>
  prevHash: string
  hash: string
}

export type AuditEvent =
  | "payment.received"
  | "payment.failed"
  | "policy.violation"
  | "auth.challenge"
  | "auth.verified"
  | "replay.rejected"
  | "config.loaded"
  | "tool.called"

export class AuditLog {
  private db: BetterSqlite3.Database
  private lastHash: string = "0"

  constructor(db: BetterSqlite3.Database) {
    this.db = db
    this.init()
  }

  private init(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS audit_log (
        seq INTEGER PRIMARY KEY AUTOINCREMENT,
        id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        event TEXT NOT NULL,
        data TEXT NOT NULL,
        prev_hash TEXT NOT NULL,
        hash TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_audit_event ON audit_log(event);
      CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);
    `)

    // Load last hash for chain continuity
    const last = this.db
      .prepare("SELECT hash FROM audit_log ORDER BY seq DESC LIMIT 1")
      .get() as { hash: string } | undefined
    if (last) this.lastHash = last.hash
  }

  /** Append an event to the tamper-evident log */
  append(event: AuditEvent, data: Record<string, unknown>): AuditEntry {
    const id = randomUUID()
    const timestamp = new Date().toISOString()
    const dataJson = JSON.stringify(data)

    const hash = createHash("sha256")
      .update(`${this.lastHash}|${timestamp}|${event}|${dataJson}`)
      .digest("hex")

    this.db
      .prepare("INSERT INTO audit_log (id, timestamp, event, data, prev_hash, hash) VALUES (?, ?, ?, ?, ?, ?)")
      .run(id, timestamp, event, dataJson, this.lastHash, hash)

    const entry: AuditEntry = {
      seq: 0, // will be set by AUTOINCREMENT
      id,
      timestamp,
      event,
      data,
      prevHash: this.lastHash,
      hash,
    }

    this.lastHash = hash
    return entry
  }

  /** Verify the entire hash chain integrity */
  verify(): { valid: boolean; brokenAt?: number; error?: string } {
    const rows = this.db
      .prepare("SELECT seq, timestamp, event, data, prev_hash, hash FROM audit_log ORDER BY seq ASC")
      .all() as Array<{ seq: number; timestamp: string; event: string; data: string; prev_hash: string; hash: string }>

    let prevHash = "0"
    for (const row of rows) {
      const expected = createHash("sha256")
        .update(`${prevHash}|${row.timestamp}|${row.event}|${row.data}`)
        .digest("hex")

      if (row.hash !== expected) {
        return { valid: false, brokenAt: row.seq, error: `Hash mismatch at seq ${row.seq}` }
      }
      if (row.prev_hash !== prevHash) {
        return { valid: false, brokenAt: row.seq, error: `Chain broken at seq ${row.seq}` }
      }
      prevHash = row.hash
    }

    return { valid: true }
  }

  /** Query audit log by event type */
  query(event?: AuditEvent, limit = 50): AuditEntry[] {
    const sql = event
      ? "SELECT * FROM audit_log WHERE event = ? ORDER BY seq DESC LIMIT ?"
      : "SELECT * FROM audit_log ORDER BY seq DESC LIMIT ?"
    const args = event ? [event, limit] : [limit]

    return (this.db.prepare(sql).all(...args) as Array<Record<string, unknown>>).map((row) => ({
      seq: row.seq as number,
      id: row.id as string,
      timestamp: row.timestamp as string,
      event: row.event as string,
      data: JSON.parse(row.data as string),
      prevHash: row.prev_hash as string,
      hash: row.hash as string,
    }))
  }

  /** Get the latest hash (for Stellar anchoring) */
  getLatestHash(): string {
    return this.lastHash
  }

  /** Get total entry count */
  count(): number {
    const row = this.db.prepare("SELECT COUNT(*) as cnt FROM audit_log").get() as { cnt: number }
    return row.cnt
  }
}
