import { randomUUID } from "node:crypto"

export type LogLevel = "debug" | "info" | "warn" | "error"

export interface LogEntry {
  timestamp: string
  level: LogLevel
  correlationId?: string
  tool?: string
  caller?: string
  protocol?: string
  latencyMs?: number
  message: string
  [key: string]: unknown
}

export interface LogConfig {
  level?: LogLevel
  format?: "json" | "text"
}

const LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 }

export class TollLogger {
  private minLevel: number
  private format: "json" | "text"

  constructor(config?: LogConfig) {
    this.minLevel = LEVELS[config?.level ?? "info"]
    this.format = config?.format ?? "json"
  }

  static generateCorrelationId(): string {
    return randomUUID().slice(0, 8)
  }

  private shouldLog(level: LogLevel): boolean {
    return LEVELS[level] >= this.minLevel
  }

  private emit(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return
    if (this.format === "json") {
      const out = entry.level === "error" ? console.error : console.log
      out(JSON.stringify(entry))
    } else {
      const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`
      const ctx = entry.correlationId ? ` [${entry.correlationId}]` : ""
      const tool = entry.tool ? ` tool=${entry.tool}` : ""
      const caller = entry.caller ? ` caller=${entry.caller}` : ""
      const out = entry.level === "error" ? console.error : console.log
      out(`${prefix}${ctx}${tool}${caller} ${entry.message}`)
    }
  }

  log(level: LogLevel, message: string, extra?: Partial<LogEntry>): void {
    this.emit({ timestamp: new Date().toISOString(), level, message, ...extra })
  }

  debug(message: string, extra?: Partial<LogEntry>): void { this.log("debug", message, extra) }
  info(message: string, extra?: Partial<LogEntry>): void { this.log("info", message, extra) }
  warn(message: string, extra?: Partial<LogEntry>): void { this.log("warn", message, extra) }
  error(message: string, extra?: Partial<LogEntry>): void { this.log("error", message, extra) }
}

export function createLogger(config?: LogConfig): TollLogger {
  return new TollLogger(config)
}
