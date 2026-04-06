export interface SanitizationConfig {
  maxArgSize?: number // max total arg bytes, default 102400 (100KB)
  maxStringLength?: number // max single string length, default 10000
  stripHtml?: boolean // strip HTML/script tags, default true
}

export interface SanitizationResult {
  clean: unknown
  violations: string[]
}

const HTML_TAG_RE = /<\/?[a-z][\s\S]*?>/gi
const PROTO_KEYS = new Set(["__proto__", "constructor", "prototype"])

export function sanitize(args: unknown, config?: SanitizationConfig): SanitizationResult {
  const maxSize = config?.maxArgSize ?? 102400
  const maxStr = config?.maxStringLength ?? 10000
  const stripHtml = config?.stripHtml ?? true
  const violations: string[] = []

  // Check total size
  const json = JSON.stringify(args)
  if (json.length > maxSize) {
    violations.push(`Arguments exceed max size (${json.length} > ${maxSize} bytes)`)
    return { clean: null, violations }
  }

  function walk(val: unknown, path: string): unknown {
    if (val === null || val === undefined) return val
    if (typeof val === "string") {
      if (val.length > maxStr) {
        violations.push(`String at ${path} exceeds max length (${val.length} > ${maxStr})`)
        return val.slice(0, maxStr)
      }
      if (stripHtml) return val.replace(HTML_TAG_RE, "")
      return val
    }
    if (typeof val === "number" || typeof val === "boolean") return val
    if (Array.isArray(val)) return val.map((v, i) => walk(v, `${path}[${i}]`))
    if (typeof val === "object") {
      const out: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
        if (PROTO_KEYS.has(k)) {
          violations.push(`Prototype pollution attempt at ${path}.${k}`)
          continue
        }
        out[k] = walk(v, `${path}.${k}`)
      }
      return out
    }
    return val
  }

  const clean = walk(args, "args")
  return { clean, violations }
}
