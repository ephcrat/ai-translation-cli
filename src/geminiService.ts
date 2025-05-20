import { GoogleGenAI } from "@google/genai";
import { getApiKey } from "./config";

const API_KEY = getApiKey();
const genAI = new GoogleGenAI({ apiKey: API_KEY });

const MODEL_NAME = "gemini-2.5-flash-preview-05-20";

/**
 * Constructs the prompt for the Gemini API.
 * @param gitDiff The git diff text of the source language (e.g., en.json).
 * @param currentLocaleJsonString The stringified JSON content of the current target locale (e.g., es.json).
 * @param targetLocaleCode The locale code for the target language (e.g., "es").
 * @param targetLanguageName The full name of the target language (e.g., "Spanish").
 * @returns The constructed prompt string.
 */
export function constructPrompt(
  gitDiff: string,
  currentLocaleJsonString: string,
  targetLocaleCode: string, // e.g., "es"
  targetLanguageName: string // e.g., "Spanish"
): string {
  const prompt = `
You're an expert translator for mobile and web applications, you know the best practices of internationalization and localization using the i18n JSON format.

Translate the new and updated English text from the following git diff into ${targetLanguageName} (${targetLocaleCode}).

**Context of Existing ${targetLanguageName} Translations (current ${targetLocaleCode}.json):**
\`\`\`json
${currentLocaleJsonString}
\`\`\`

**Git Diff of en.json (Source of new/updated English text):**
\`\`\`diff
${gitDiff}
\`\`\`

**Instructions:**
1.  Analyze the git diff to identify added or modified English key-value pairs.
2.  Refer to the provided ${targetLanguageName} JSON file (context) to maintain consistency in style, tone, and terminology.
3.  Translate only the English text from the diff into ${targetLanguageName}. By any means, do not update or remove any existing translations from the context file if not specified in the diff.
4.  Ensure the output is a complete, valid JSON object representing the updated ${targetLocaleCode}.json file. It should include all existing translations from the context file plus the new/updated translations from the diff.
5.  Maintain the original JSON structure and keys. Do not translate keys.
6.  Handle placeholders like {{variable}} or <tag> correctly; they should remain untranslated and in place.
7.  If a key from the diff already exists in the target locale context, update its translation if the English source has changed. If it's a new key, add it with its translation.
8.  Return ONLY the complete JSON object as a string, without any surrounding text, explanations, or markdown formatting. It is very important that the JSON is valid or the translation task will fail. Only return the valid JSON string, nothing else. Your whole response will be parsed as JSON using JSON.parse() and shouldn't throw any errors, ensure all brackets are closed.
9.  The JSON string should be in the following format:
    {
      "translationKey": "translationValue"
    }
    ...
    
**Updated ${targetLocaleCode}.json:**
`;
  return prompt;
}

/**
 * Sends the prompt to the Gemini API and retrieves the translation.
 * @param prompt The prompt string to send to the API.
 * @returns A promise that resolves to the text response from the API.
 * @throws Error if the API call fails or returns an empty/invalid response.
 */
export async function getTranslationsFromGemini(
  prompt: string
): Promise<string> {
  try {
    const result = await genAI.models.generateContent({
      model: MODEL_NAME,
      contents: [prompt],
      config: {
        temperature: 0.7,
        responseMimeType: "application/json",
      },
    });

    const text = result.text;
    if (typeof text !== "string" || text.trim() === "") {
      throw new Error("Gemini API returned an empty or invalid response.");
    }

    return text;
  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    const promptFeedback =
      error.response?.promptFeedback ?? error.promptFeedback;
    if (promptFeedback) {
      console.error("Prompt Feedback:", promptFeedback);
      throw new Error(
        `Gemini API request failed or was blocked. Feedback: ${JSON.stringify(
          promptFeedback
        )}`
      );
    }
    throw new Error(`Failed to get translations from Gemini: ${error.message}`);
  }
}
