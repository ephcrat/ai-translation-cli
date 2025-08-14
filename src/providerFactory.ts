import { GeminiProvider } from "./providers/GeminiProvider";
import { OpenAIProvider } from "./providers/OpenAIProvider";
import type {
  LLMProvider,
  ProviderName,
  ProviderOptions,
} from "./providers/LLMProvider";

export function createProvider(
  provider: ProviderName = "gemini",
  options: ProviderOptions = {}
): LLMProvider {
  switch (provider) {
    case "gemini":
    default:
      return new GeminiProvider(options);
    case "openai":
      return new OpenAIProvider(options);
  }
}
