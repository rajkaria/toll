// Core — the only things developers need
export { tollMiddleware } from "./middleware.js"
export { validateConfig, loadConfig, isFree } from "./config.js"
export { withToll } from "./withToll.js"
export { createHealthRoutes } from "./health.js"

// Supporting — used internally but available for advanced usage
export { RateLimiter } from "./rateLimiter.js"
export { SpendingPolicy, getSpendingPolicy } from "./spendingPolicy.js"
export type { SpendingPolicyConfig } from "./spendingPolicy.js"
export { createLogger, TollLogger } from "./logger.js"
export type { LogLevel, LogEntry, LogConfig } from "./logger.js"
