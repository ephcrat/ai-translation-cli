export interface LLMProvider {
  name(): ProviderName;

  /**
   * Execute a translation request given a fully constructed prompt and an optional
   * path to the current locale JSON (used as context for some providers).
   * Returns a raw JSON string whose structure depends on the prompt/mode
   * (e.g., full updated JSON, or a delta containing only additions/updates).
   */
  translate(prompt: string, currentLocaleJsonPath: string): Promise<string>;
}

export type ProviderName = "gemini" | "openai";

export interface ProviderOptions {
  model?: string;
  temperature?: number;
}
