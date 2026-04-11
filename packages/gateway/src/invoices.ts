import type { EarningsTracker } from "@rajkaria123/toll-stellar"

export interface InvoiceConfig {
  enabled?: boolean
  sellerName?: string
  sellerAddress?: string
}

export interface Invoice {
  invoiceId: string
  transactionId: string
  date: string
  seller: { name: string; stellarAddress: string }
  buyer: { callerId: string }
  tool: string
  amount: number
  currency: string
  protocol: string
  txHash: string | null
  network: string
}

export interface Receipt {
  receiptId: string
  transactionId: string
  date: string
  amount: number
  currency: string
  protocol: string
  txHash: string | null
  status: "confirmed"
  stellarExplorerUrl: string | null
}

export class InvoiceGenerator {
  private config: InvoiceConfig
  private network: string
  private payTo: string

  constructor(config: InvoiceConfig, network: string, payTo: string) {
    this.config = config
    this.network = network
    this.payTo = payTo
  }

  /** Generate an invoice for a transaction */
  generateInvoice(tx: { id: string; tool: string; caller: string | null; amountUsdc: number; protocol: string; txHash: string | null; createdAt: number }): Invoice {
    return {
      invoiceId: `INV-${tx.id.slice(0, 8).toUpperCase()}`,
      transactionId: tx.id,
      date: new Date(tx.createdAt).toISOString(),
      seller: {
        name: this.config.sellerName ?? "Toll MCP Server",
        stellarAddress: this.payTo,
      },
      buyer: { callerId: tx.caller ?? "anonymous" },
      tool: tx.tool,
      amount: tx.amountUsdc,
      currency: "USDC",
      protocol: tx.protocol,
      txHash: tx.txHash,
      network: this.network,
    }
  }

  /** Generate a receipt for a transaction */
  generateReceipt(tx: { id: string; amountUsdc: number; protocol: string; txHash: string | null; createdAt: number }): Receipt {
    const explorerBase = this.network === "testnet"
      ? "https://stellar.expert/explorer/testnet/tx"
      : "https://stellar.expert/explorer/public/tx"

    return {
      receiptId: `REC-${tx.id.slice(0, 8).toUpperCase()}`,
      transactionId: tx.id,
      date: new Date(tx.createdAt).toISOString(),
      amount: tx.amountUsdc,
      currency: "USDC",
      protocol: tx.protocol,
      txHash: tx.txHash,
      status: "confirmed",
      stellarExplorerUrl: tx.txHash ? `${explorerBase}/${tx.txHash}` : null,
    }
  }
}
