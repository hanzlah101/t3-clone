import "server-only"

import { openai } from "@ai-sdk/openai"
import { google } from "@ai-sdk/google"
import { createOpenRouter } from "@openrouter/ai-sdk-provider"
// import { deepseek } from "@ai-sdk/deepseek"
// import { anthropic } from "@ai-sdk/anthropic"

import { env } from "@/env"
import { type ModelConfig } from "@/lib/models"

const openrouter = createOpenRouter({
  apiKey: env.OPENROUTER_API_KEY
})

export function getModelProvider(config: ModelConfig, search: boolean) {
  switch (config.provider) {
    case "openai":
      return openai(config.id)
    case "gemini":
      return google(config.id, { useSearchGrounding: search })
    case "deepseek":
      return openrouter(config.id)
    // case "anthropic":
    //   return anthropic(config.id)
    default:
      throw new Error(`Unsupported provider: ${config}`)
  }
}
