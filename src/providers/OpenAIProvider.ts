import type { LLMProvider, ProviderName, ProviderOptions } from "./LLMProvider";
import { getOpenAIApiKey } from "../config";
import * as fs from "fs/promises";

interface OpenAIClientOptions {
  apiKey: string;
  baseURL?: string;
}

class OpenAIClient {
  private readonly apiKey: string;
  private readonly baseURL: string;

  constructor(options: OpenAIClientOptions) {
    this.apiKey = options.apiKey;
    this.baseURL = options.baseURL ?? "https://api.openai.com/v1";
  }

  async responsesCreate(body: any): Promise<any> {
    const res = await fetch(`${this.baseURL}/responses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenAI API error ${res.status}: ${text}`);
    }
    return res.json();
  }
}

export class OpenAIProvider implements LLMProvider {
  private readonly client: OpenAIClient;
  private readonly model: string;
  private readonly temperature: number;

  constructor(options: ProviderOptions = {}) {
    const apiKey = getOpenAIApiKey();
    this.client = new OpenAIClient({ apiKey });
    this.model = options.model ?? "gpt-5-nano";
    this.temperature = options.temperature ?? 0.7;
  }

  name(): ProviderName {
    return "openai";
  }

  private extractTextFromResponse(response: any): string | null {
    if (
      typeof response?.output_text === "string" &&
      response.output_text.trim() !== ""
    ) {
      return response.output_text;
    }
    const outputs = response?.output;
    if (Array.isArray(outputs)) {
      for (const output of outputs) {
        const content = output?.content;
        if (Array.isArray(content)) {
          for (const item of content) {
            if (typeof item?.text === "string" && item.text.trim() !== "") {
              return item.text;
            }
          }
        }
      }
    }
    if (typeof response?.content?.[0]?.text === "string") {
      return response.content[0].text;
    }
    if (typeof response?.choices?.[0]?.message?.content === "string") {
      return response.choices[0].message.content;
    }
    return null;
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

    // Compose input as text+attachment style for parity with Gemini
    // For OpenAI Responses API with structured outputs, we request JSON mode.
    const input =
      prompt +
      (currentLocaleJsonContent
        ? `\n\nContext JSON file contents (do not echo this back except as part of the final JSON output):\n${currentLocaleJsonContent}`
        : "");

    const requestBody: any = {
      model: this.model,
      input,
      text: { format: { type: "json_object" } },
    };

    const response = await this.client.responsesCreate(requestBody);

    const text = this.extractTextFromResponse(response);
    if (!text) {
      try {
        const preview = JSON.stringify(response, null, 2);
        console.error("OpenAI response (preview):", preview.slice(0, 2000));
      } catch {}
      throw new Error("OpenAI API returned an empty or invalid response.");
    }
    return text;
  }
}
