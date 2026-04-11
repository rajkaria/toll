export interface ProxyConfig {
  port: number
  defaultTarget?: string
  secretKey?: string
  budget: {
    maxPerCall?: string
    maxDaily?: string
  }
  registryUrl: string
  metricsEnabled: boolean
}
