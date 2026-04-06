export interface DegradationConfig {
  strategy?: "reject" | "downgrade" | "queue"
  downgradeMap?: Record<string, string> // premium_tool -> basic_tool
  queueTtlSeconds?: number
}

export interface DegradationResult {
  action: "reject" | "downgrade" | "queue"
  alternativeTool?: string
  queueId?: string
  message: string
}

export class BudgetDegradation {
  private config: DegradationConfig

  constructor(config?: DegradationConfig) {
    this.config = config ?? { strategy: "reject" }
  }

  /** Determine what to do when budget is exhausted */
  handle(toolName: string): DegradationResult {
    const strategy = this.config.strategy ?? "reject"

    if (strategy === "downgrade") {
      const alternative = this.config.downgradeMap?.[toolName]
      if (alternative) {
        return {
          action: "downgrade",
          alternativeTool: alternative,
          message: `Budget exhausted. Consider using '${alternative}' (cheaper alternative).`,
        }
      }
      // No downgrade available, fall through to reject
    }

    if (strategy === "queue") {
      const queueId = `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      return {
        action: "queue",
        queueId,
        message: `Budget exhausted. Request queued (ID: ${queueId}). Top up your budget and retry.`,
      }
    }

    return {
      action: "reject",
      message: "Budget exhausted. Payment required to continue.",
    }
  }
}
