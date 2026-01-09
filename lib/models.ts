export type Provider = "openai" | "google";

export interface ModelConfig {
  id: string;
  name: string;
  provider: Provider;
  description?: string;
}

export const AVAILABLE_MODELS: ModelConfig[] = [
  // OpenAI models
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    description: "Most capable OpenAI model",
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    description: "Fast and efficient",
  },
  // Google models
  {
    id: "gemini-3-flash-preview",
    name: "Gemini 3 Flash",
    provider: "google",
    description: "Fast multimodal model",
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "google",
    description: "Fast multimodal model",
  },
];

export const DEFAULT_MODEL: ModelConfig = AVAILABLE_MODELS[0];

export function getModelById(id: string): ModelConfig | undefined {
  return AVAILABLE_MODELS.find((model) => model.id === id);
}

export function getModelsByProvider(provider: Provider): ModelConfig[] {
  return AVAILABLE_MODELS.filter((model) => model.provider === provider);
}
