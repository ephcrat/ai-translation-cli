export interface LLMProvider {
  name(): ProviderName;

  /**
   * Execute a translation request given a fully constructed prompt and an optional
   * path to the current locale JSON (used as context for some providers).
   * Must return a raw JSON string representing the full updated locale file.
   */
  translate(prompt: string, currentLocaleJsonPath: string): Promise<string>;
}

export type ProviderName = "gemini" | "openai";

export interface ProviderOptions {
  model?: string;
  temperature?: number;
}
