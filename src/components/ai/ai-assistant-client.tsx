"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Bot, Send, User, Lock, Loader2, AlertCircle, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Message {
  role: "user" | "assistant"
  content: string
}

const EXAMPLE_QUESTIONS = [
  "Summarize my family's recent reports",
  "What were the hemoglobin values in the last blood test?",
  "Show me changes in my father's test results over time",
  "What questions should I ask the doctor about the latest report?",
]

interface AIAssistantClientProps {
  isPro: boolean
  userName: string
}

export function AIAssistantClient({ isPro, userName }: AIAssistantClientProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function handleSend() {
    const message = input.trim()
    if (!message || loading) return

    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: message }])
    setLoading(true)

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, conversationId }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.error ?? "Sorry, I couldn't process that request.",
          },
        ])
        return
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.message }])
      if (data.conversationId) setConversationId(data.conversationId)
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm having trouble connecting. Please try again.",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }


  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 lg:px-6 py-4 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">AI Health Assistant</h1>
            <p className="text-xs text-gray-400">Answers based on your uploaded records</p>
          </div>
        </div>
        <Badge variant="info">
          <Sparkles className="h-3 w-3 mr-1" />
          Pro
        </Badge>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
        {/* Disclaimer */}
        <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2.5">
          <AlertCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            CareCircle AI answers questions based on your uploaded health records only.
            It does not provide medical diagnosis or treatment. Always consult a healthcare professional.
          </p>
        </div>

        {/* Welcome state */}
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <Bot className="h-7 w-7 text-blue-500" />
            </div>
            <h2 className="font-semibold text-gray-900">
              Hello, {userName.split(" ")[0]}!
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Ask me anything about your family&apos;s uploaded health records.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-6 text-left max-w-lg mx-auto">
              {EXAMPLE_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="text-sm text-left rounded-lg border border-gray-200 bg-white px-3 py-2.5 hover:border-blue-300 hover:bg-blue-50 transition-colors text-gray-600 hover:text-blue-700"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat messages */}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === "user"
                  ? "bg-blue-600"
                  : "bg-gray-100"
              }`}
            >
              {msg.role === "user" ? (
                <User className="h-4 w-4 text-white" />
              ) : (
                <Bot className="h-4 w-4 text-gray-600" />
              )}
            </div>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-tr-sm"
                  : "bg-white border border-gray-100 text-gray-800 rounded-tl-sm"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}

        {/* Loading */}
        {loading && (
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4 text-gray-600" />
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                <span className="text-xs text-gray-400">Checking your records...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 bg-white p-4">
        <div className="flex gap-3 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your health records..."
            className="flex-1 min-h-[44px] max-h-32 resize-none"
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            size="icon"
            className="h-11 w-11 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
