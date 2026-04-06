import type BetterSqlite3 from "better-sqlite3"

export interface CohortData {
  cohortWeek: string
  totalCallers: number
  retentionByWeek: Record<string, number> // week -> % retained
}

export interface CohortRevenue {
  cohortWeek: string
  totalRevenue: number
  avgRevenuePerCaller: number
  callerCount: number
}

export class CohortAnalytics {
  private db: BetterSqlite3.Database

  constructor(db: BetterSqlite3.Database) {
    this.db = db
  }

  /** Get caller retention by weekly cohort */
  getRetention(weeks = 8): CohortData[] {
    // Get first-seen week for each caller
    const cohorts = this.db.prepare(`
      SELECT
        strftime('%Y-W%W', MIN(created_at)/1000, 'unixepoch') as cohort_week,
        caller,
        MIN(created_at) as first_seen
      FROM transactions
      WHERE caller IS NOT NULL
      GROUP BY caller
    `).all() as Array<{ cohort_week: string; caller: string; first_seen: number }>

    // Group callers by cohort
    const cohortMap = new Map<string, string[]>()
    for (const c of cohorts) {
      const list = cohortMap.get(c.cohort_week) ?? []
      list.push(c.caller)
      cohortMap.set(c.cohort_week, list)
    }

    const result: CohortData[] = []
    for (const [week, callers] of cohortMap) {
      const retention: Record<string, number> = {}

      // For each subsequent week, check how many callers were active
      for (let w = 0; w < weeks; w++) {
        const weekStart = Date.now() - (weeks - w) * 7 * 86400000
        const weekEnd = weekStart + 7 * 86400000

        const active = this.db.prepare(`
          SELECT COUNT(DISTINCT caller) as cnt
          FROM transactions
          WHERE caller IN (${callers.map(() => "?").join(",")})
            AND created_at >= ? AND created_at < ?
        `).get(...callers, weekStart, weekEnd) as { cnt: number }

        retention[`week_${w}`] = callers.length > 0 ? Math.round((active.cnt / callers.length) * 100) : 0
      }

      result.push({ cohortWeek: week, totalCallers: callers.length, retentionByWeek: retention })
    }

    return result.slice(-weeks)
  }

  /** Get revenue by weekly cohort */
  getRevenuePerCohort(): CohortRevenue[] {
    const rows = this.db.prepare(`
      SELECT
        strftime('%Y-W%W', first_seen/1000, 'unixepoch') as cohort_week,
        COUNT(DISTINCT t.caller) as caller_count,
        COALESCE(SUM(t.amount_usdc), 0) as total_revenue
      FROM transactions t
      INNER JOIN (
        SELECT caller, MIN(created_at) as first_seen
        FROM transactions WHERE caller IS NOT NULL GROUP BY caller
      ) c ON t.caller = c.caller
      WHERE t.caller IS NOT NULL
      GROUP BY cohort_week
      ORDER BY cohort_week
    `).all() as Array<{ cohort_week: string; caller_count: number; total_revenue: number }>

    return rows.map((r) => ({
      cohortWeek: r.cohort_week,
      totalRevenue: r.total_revenue,
      avgRevenuePerCaller: r.caller_count > 0 ? r.total_revenue / r.caller_count : 0,
      callerCount: r.caller_count,
    }))
  }
}
