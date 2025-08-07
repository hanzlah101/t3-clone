import {
  SiGooglegemini,
  SiOpenai,
  SiAnthropic
} from "@icons-pack/react-simple-icons"

import { DeepSeekIcon } from "@/components/icons/deepseek"

export const DEFAULT_MODEL: ModelId = "gemini-2.0-flash-lite"

export const SUPPORTED_MODELS = Object.freeze([
  // OpenAI Models
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    description: "OpenAI's efficient model with multimodal capabilities",
    provider: "openai",
    supportsSearch: true,
    supportsImageUploads: true,
    supportsPDFUploads: false,
    maxTokens: 16384,
    temperature: 0.7
  },
  {
    id: "gpt-4.1-mini",
    name: "GPT-4.1 Mini",
    description: "Latest OpenAI model with improved reasoning",
    provider: "openai",
    supportsSearch: true,
    supportsImageUploads: true,
    supportsPDFUploads: false,
    maxTokens: 16384,
    temperature: 0.7
  },

  // Google Gemini Models
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    description: "Google's latest stable model with enhanced capabilities",
    provider: "gemini",
    supportsSearch: true,
    supportsImageUploads: true,
    supportsPDFUploads: true,
    maxTokens: 8192,
    temperature: 0.7
  },
  {
    id: "gemini-2.0-flash-exp",
    name: "Gemini 2.0 Flash Experimental",
    description:
      "Google's latest experimental model with enhanced capabilities",
    provider: "gemini",
    supportsSearch: true,
    supportsImageUploads: true,
    supportsPDFUploads: true,
    maxTokens: 8192,
    temperature: 0.7
  },
  {
    id: "gemini-2.0-flash-lite",
    name: "Gemini 2.0 Flash Lite",
    description: "Lightweight version of Gemini 2.0 with vision support",
    provider: "gemini",
    supportsSearch: true,
    supportsImageUploads: true,
    supportsPDFUploads: true,
    maxTokens: 8192,
    temperature: 0.7
  },
  {
    id: "gemini-1.5-flash",
    name: "Gemini 1.5 Flash",
    description:
      "Fast, efficient model optimized for speed (Free tier available)",
    provider: "gemini",
    supportsSearch: true,
    supportsImageUploads: true,
    supportsPDFUploads: true,
    maxTokens: 8192,
    temperature: 0.7
  },

  // DeepSeek Models
  {
    id: "deepseek/deepseek-chat:free",
    name: "DeepSeek Chat",
    description: "DeepSeek's conversational AI model",
    provider: "deepseek",
    supportsSearch: false,
    supportsImageUploads: false,
    supportsPDFUploads: false,
    maxTokens: 4096,
    temperature: 0.7
  },
  {
    id: "deepseek/deepseek-r1:free",
    name: "DeepSeek R1",
    description: "Advanced reasoning model for complex tasks",
    provider: "deepseek",
    supportsSearch: false,
    supportsImageUploads: false,
    supportsPDFUploads: false,
    maxTokens: 8192,
    temperature: 0.8
  }

  // Anthropic Models
  // {
  //   id: "claude-3-5-sonnet-20241022",
  //   name: "Claude 3.5 Sonnet",
  //   description: "Anthropic's balanced model for general use",
  //   provider: "anthropic",
  //   supportsSearch: false,
  //   supportsImageUploads: true,
  //   supportsPDFUploads: true,
  //   maxTokens: 8192,
  //   temperature: 0.7
  // },
  // {
  //   id: "claude-3-5-haiku-20241022",
  //   name: "Claude 3.5 Haiku",
  //   description: "Fast, efficient model for quick tasks",
  //   provider: "anthropic",
  //   supportsSearch: false,
  //   supportsImageUploads: true,
  //   supportsPDFUploads: true,
  //   maxTokens: 8192,
  //   temperature: 0.7
  // },
  // {
  //   id: "claude-3-opus-20240229",
  //   name: "Claude 3 Opus",
  //   description: "Anthropic's most capable model for complex tasks",
  //   provider: "anthropic",
  //   supportsSearch: false,
  //   supportsImageUploads: true,
  //   supportsPDFUploads: true,
  //   maxTokens: 4096,
  //   temperature: 0.7
  // }
] as const)

export type ModelConfig = (typeof SUPPORTED_MODELS)[number]
export type ModelId = ModelConfig["id"]

export const MODELS_BY_PROVIDER = Object.entries(
  SUPPORTED_MODELS.reduce(
    (acc, model) => {
      if (!acc[model.provider]) acc[model.provider] = []
      acc[model.provider].push(model)
      return acc
    },
    {} as Record<ModelConfig["provider"], ModelConfig[]>
  )
) as [ModelConfig["provider"], ModelConfig[]][]

export function getModelById(modelId?: string): ModelConfig {
  const model = SUPPORTED_MODELS.find((model) => model.id === modelId)
  if (!model) {
    return SUPPORTED_MODELS.find((model) => model.id === DEFAULT_MODEL)!
  }
  return model
}

export function isModelValid(modelId: string): boolean {
  return SUPPORTED_MODELS.some((model) => model.id === modelId)
}

export function getModelName(id: string) {
  return SUPPORTED_MODELS.find((model) => model.id === id)?.name ?? id
}

export const PROVIDER_CONFIGS = {
  openai: {
    name: "OpenAI",
    icon: SiOpenai
  },
  gemini: {
    name: "Gemini",
    icon: SiGooglegemini
  },
  deepseek: {
    name: "DeepSeek",
    icon: DeepSeekIcon
  },
  anthropic: {
    name: "Anthropic",
    icon: SiAnthropic
  }
} as const
