"use client"

import { useState, useEffect, useCallback } from "react"
import { CodeBlock } from "@/components/shared/CodeBlock"
import { DEMO_STEPS, type DemoStep } from "@/lib/mock-demo-data"

type SubState = "idle" | "sending" | "received" | "paying" | "paid"

function StatusDot({ active, done }: { active: boolean; done: boolean }) {
  return (
    <span className={`inline-block w-2.5 h-2.5 rounded-full transition-colors duration-500 ${
      done ? "bg-emerald-400" : active ? "bg-emerald-400 animate-pulse" : "bg-gray-700"
    }`} />
  )
}

export default function DemoPage() {
  const [stepIdx, setStepIdx] = useState(-1)
  const [subState, setSubState] = useState<SubState>("idle")
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  const currentStep: DemoStep | null = stepIdx >= 0 ? DEMO_STEPS[stepIdx] : null

  const runStep = useCallback((idx: number) => {
    setStepIdx(idx)
    setSubState("sending")
  }, [])

  // Auto-run full demo: step 0 (free) → step 1 (paid x402 flow) on page load
  const [autoPlaying, setAutoPlaying] = useState(true)

  useEffect(() => {
    if (!autoPlaying) return
    const timer = setTimeout(() => runStep(0), 800)
    return () => clearTimeout(timer)
  }, [runStep, autoPlaying])

  useEffect(() => {
    if (subState === "idle") return
    const step = DEMO_STEPS[stepIdx]
    if (!step) return

    let timer: ReturnType<typeof setTimeout>

    if (subState === "sending") {
      timer = setTimeout(() => setSubState("received"), 1500)
    } else if (subState === "received") {
      if (step.isPayment) {
        timer = setTimeout(() => setSubState("paying"), 1500)
      } else {
        setCompletedSteps((s) => new Set(s).add(stepIdx))
        // Auto-advance to next step if auto-playing
        if (autoPlaying && stepIdx < DEMO_STEPS.length - 1) {
          timer = setTimeout(() => runStep(stepIdx + 1), 1200)
        } else {
          timer = setTimeout(() => { setSubState("idle"); setAutoPlaying(false) }, 500)
        }
      }
    } else if (subState === "paying") {
      timer = setTimeout(() => setSubState("paid"), 2000)
    } else if (subState === "paid") {
      setCompletedSteps((s) => new Set(s).add(stepIdx))
      timer = setTimeout(() => { setSubState("idle"); setAutoPlaying(false) }, 1000)
    }

    return () => clearTimeout(timer)
  }, [subState, stepIdx, autoPlaying, runStep])

  const getRequestJson = () => {
    if (!currentStep) return ""
    if (subState === "paid" && currentStep.retryRequest) {
      return JSON.stringify(currentStep.retryRequest, null, 2)
    }
    return JSON.stringify(currentStep.request, null, 2)
  }

  const getResponseJson = () => {
    if (!currentStep) return ""
    if (subState === "paid" && currentStep.retryResponse) {
      return JSON.stringify(currentStep.retryResponse, null, 2)
    }
    if (subState === "received" || subState === "paying") {
      return JSON.stringify(currentStep.response, null, 2)
    }
    if (subState === "paid") {
      return JSON.stringify(currentStep.retryResponse ?? currentStep.response, null, 2)
    }
    return ""
  }

  const getStatusCode = () => {
    if (!currentStep) return null
    if (subState === "paid" && currentStep.retryStatus) return currentStep.retryStatus
    if (subState === "received" || subState === "paying") return currentStep.status
    return null
  }

  const statusCode = getStatusCode()

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-white tracking-tight">Interactive Demo</h1>
        <p className="text-sm text-gray-500 mt-2">
          See how Toll gates MCP tool calls with Stellar micropayments
        </p>
      </div>

      {/* Step buttons */}
      <div className="flex items-center justify-center gap-4 mb-10">
        {DEMO_STEPS.map((step, i) => (
          <button
            key={step.id}
            onClick={() => runStep(i)}
            disabled={subState !== "idle"}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors border ${
              stepIdx === i && subState !== "idle"
                ? "border-emerald-500/50 bg-emerald-950/30 text-emerald-300"
                : "border-gray-700 bg-gray-900/50 text-gray-300 hover:text-white hover:border-gray-500"
            } disabled:opacity-50`}
          >
            <StatusDot active={stepIdx === i && subState !== "idle"} done={completedSteps.has(i)} />
            {step.title}
          </button>
        ))}
      </div>

      {/* Flow indicator */}
      <div className="flex items-center justify-center gap-3 mb-8 text-xs">
        <span className={`px-3 py-1 rounded-full border transition-colors duration-500 ${
          subState === "sending" || subState === "paying" ? "border-emerald-500/50 text-emerald-400 bg-emerald-950/30" : "border-gray-700 text-gray-500"
        }`}>Agent</span>
        <span className="text-gray-600">&rarr;</span>
        <span className={`px-3 py-1 rounded-full border transition-colors duration-500 ${
          subState === "sending" ? "border-yellow-500/50 text-yellow-400 bg-yellow-950/20" : "border-gray-700 text-gray-500"
        }`}>Toll Gateway</span>
        <span className="text-gray-600">&rarr;</span>
        <span className={`px-3 py-1 rounded-full border transition-colors duration-500 ${
          (subState === "received" && !currentStep?.isPayment) || subState === "paid"
            ? "border-emerald-500/50 text-emerald-400 bg-emerald-950/30"
            : subState === "received" && currentStep?.isPayment
            ? "border-red-500/50 text-red-400 bg-red-950/20"
            : "border-gray-700 text-gray-500"
        }`}>MCP Server</span>
        {currentStep?.isPayment && (
          <>
            <span className="text-gray-600">&rarr;</span>
            <span className={`px-3 py-1 rounded-full border transition-colors duration-500 ${
              subState === "paying" ? "border-blue-500/50 text-blue-400 bg-blue-950/20 animate-pulse" :
              subState === "paid" ? "border-emerald-500/50 text-emerald-400 bg-emerald-950/30" :
              "border-gray-700 text-gray-500"
            }`}>Stellar</span>
          </>
        )}
      </div>

      {/* Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request */}
        <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-700/50 flex items-center justify-between">
            <span className="text-xs text-gray-500 uppercase tracking-widest">Request</span>
            {subState === "paying" && (
              <span className="text-xs text-blue-400 animate-pulse">Signing Stellar tx...</span>
            )}
          </div>
          <div className="p-4 min-h-[300px]">
            {currentStep && subState !== "idle" ? (
              <pre className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap transition-opacity duration-500">
                {getRequestJson()}
              </pre>
            ) : (
              <p className="text-xs text-gray-600 text-center pt-20">
                Click a step above to start the demo
              </p>
            )}
          </div>
        </div>

        {/* Response */}
        <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-700/50 flex items-center justify-between">
            <span className="text-xs text-gray-500 uppercase tracking-widest">Response</span>
            {statusCode && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                statusCode === 200 ? "bg-emerald-900/60 text-emerald-300" :
                statusCode === 402 ? "bg-red-900/60 text-red-300" :
                "bg-gray-700 text-gray-400"
              }`}>
                {statusCode}
              </span>
            )}
          </div>
          <div className="p-4 min-h-[300px]">
            {subState === "sending" ? (
              <div className="flex items-center justify-center pt-20">
                <span className="text-xs text-gray-600 animate-pulse">Waiting for response...</span>
              </div>
            ) : subState === "received" || subState === "paying" || subState === "paid" ? (
              <pre className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap transition-opacity duration-500">
                {getResponseJson()}
              </pre>
            ) : (
              <p className="text-xs text-gray-600 text-center pt-20">
                Response will appear here
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {currentStep && subState !== "idle" && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">{currentStep.description}</p>
          {subState === "received" && currentStep.isPayment && (
            <p className="text-xs text-red-400 mt-2">
              402 Payment Required — agent must sign a Stellar transaction to proceed
            </p>
          )}
          {subState === "paying" && (
            <p className="text-xs text-blue-400 mt-2">
              Agent is signing a USDC payment on Stellar mainnet...
            </p>
          )}
          {subState === "paid" && (
            <p className="text-xs text-emerald-400 mt-2">
              Payment verified on-chain. Tool executed successfully.
            </p>
          )}
        </div>
      )}
    </main>
  )
}
