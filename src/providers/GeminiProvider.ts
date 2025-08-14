import { GoogleGenAI, type ContentListUnion } from "@google/genai";
import * as fs from "fs/promises";
import type { LLMProvider, ProviderName, ProviderOptions } from "./LLMProvider";
import { getGeminiApiKey } from "../config";

export class GeminiProvider implements LLMProvider {
  private readonly client: GoogleGenAI;
  private readonly model: string;
  private readonly temperature: number;

  constructor(options: ProviderOptions = {}) {
    const apiKey = getGeminiApiKey();
    this.client = new GoogleGenAI({ apiKey });
    this.model = options.model ?? "gemini-2.5-flash";
    this.temperature = options.temperature ?? 0.7;
  }

  name(): ProviderName {
    return "gemini";
  }

  async translate(
    prompt: string,
    currentLocaleJsonPath: string
  ): Promise<string> {
    let currentLocaleJsonContent: string | null = null;
    try {
      currentLocaleJsonContent = await fs.readFile(
        currentLocaleJsonPath,
        "utf-8"
      );
    } catch (readError: any) {
      if (readError.code !== "ENOENT") {
        throw new Error(
          `Failed to read context file ${currentLocaleJsonPath}: ${readError.message}`
        );
      }
    }

    const contents: ContentListUnion = [{ text: prompt }];
    if (currentLocaleJsonContent) {
      contents.push({
        inlineData: {
          mimeType: "text/plain",
          data: Buffer.from(currentLocaleJsonContent).toString("base64"),
        },
      });
    }

    try {
      const result = await this.client.models.generateContent({
        model: this.model,
        contents,
        config: {
          temperature: this.temperature,
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 0 },
        },
      });

      const text = result.text;
      if (typeof text !== "string" || text.trim() === "") {
        throw new Error("Gemini API returned an empty or invalid response.");
      }
      return text;
    } catch (error: any) {
      const promptFeedback =
        error.response?.promptFeedback ?? error.promptFeedback;
      if (promptFeedback) {
        throw new Error(
          `Gemini API request failed or was blocked. Feedback: ${JSON.stringify(
            promptFeedback
          )}`
        );
      }
      throw new Error(
        `Failed to get translations from Gemini: ${error.message}`
      );
    }
  }
}
