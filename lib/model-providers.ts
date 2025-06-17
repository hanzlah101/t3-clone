import { openai } from "@ai-sdk/openai"
import { google } from "@ai-sdk/google"
import { anthropic } from "@ai-sdk/anthropic"
import { deepseek } from "@ai-sdk/deepseek"
import { type ModelConfig } from "@/lib/models"

export function getModelProvider(config: ModelConfig) {
  switch (config.provider) {
    case "openai":
      return openai(config.id)
    case "gemini":
      return google(config.id, { useSearchGrounding: true })
    case "deepseek":
      return deepseek(config.id)
    case "anthropic":
      return anthropic(config.id)
    default:
      throw new Error(`Unsupported provider: ${config}`)
  }
}
