import { GoogleGenAI, type ContentListUnion } from "@google/genai";
import { getApiKey } from "./config";
import * as fs from "fs/promises";

const API_KEY = getApiKey();
const genAI = new GoogleGenAI({ apiKey: API_KEY });

const MODEL_NAME = "gemini-2.5-flash-preview-04-17";

/**
 * Constructs the prompt for the Gemini API.
 * @param gitDiff The git diff text of the source language (e.g., en.json).
 * @param targetLocaleCode The locale code for the target language (e.g., "es").
 * @param targetLanguageName The full name of the target language (e.g., "Spanish").
 * @returns The constructed prompt string.
 */
export function constructPrompt(
  gitDiff: string,
  targetLocaleCode: string, // e.g., "es"
  targetLanguageName: string // e.g., "Spanish"
): string {
  const prompt = `
You're an expert translator for mobile and web applications, you know the best practices of internationalization and localization.

You will be provided with two pieces of information:
1. A git diff of an English JSON locale file, showing new or updated text.
2. The complete current JSON content for the target language (${targetLanguageName} - ${targetLocaleCode}.json) as a separate file.

Your task is to translate the new and updated English text from the git diff into ${targetLanguageName} (${targetLocaleCode}) and integrate these changes into the provided ${targetLanguageName} JSON file, returning the complete updated JSON.

**Context:**
The current ${targetLanguageName} translations are provided in a separate JSON file (${targetLocaleCode}.json). This file is your base. You will return this entire file, modified ONLY with the translations from the diff.

**Git Diff of en.json (Source of new/updated English text):**
\`\`\`diff
${gitDiff}
\`\`\`

**CRITICAL Instructions - Follow These Precisely:**
1.  **Identify Changes**: Analyze the git diff to identify English key-value pairs that have been *added* or *modified*.
2.  **Translate Diff Content ONLY**: Translate *only* the English text for the keys identified in step 1 into ${targetLanguageName}.
3.  **DO NOT MODIFY OTHER CONTENT**: You MUST NOT alter, re-translate, re-order, or delete any other existing key-value pairs from the provided ${targetLanguageName} JSON context file. If a key is NOT in the diff, its translation in the output JSON MUST be identical to its translation in the provided context JSON file.
4.  **Integrate Translations**: 
    *   If a key from the diff *modifies* an existing English string, update *only* its corresponding translation in the ${targetLanguageName} JSON.
    *   If a key from the diff *adds* a new English string, add this new key and its ${targetLanguageName} translation to the JSON. Try to place new keys logically, for example, near related keys or in the order they appear in the diff.
5.  **Maintain Consistency**: Refer to the provided ${targetLanguageName} JSON file (context) to maintain consistency in style, tone, and terminology for the *new translations you are generating*.
6.  **Preserve Keys and Placeholders**: Maintain the original JSON structure and keys. Do not translate keys. Handle placeholders like {{variable}} or <tag> correctly; they should remain untranslated and in place within the translated strings.
7.  **Complete and Valid JSON Output**: The output MUST be a single, complete, and valid JSON object. This object must represent the *entirety* of the ${targetLocaleCode}.json file, including all original, untouched translations plus the new or updated translations derived *strictly* from the git diff. 
8.  **No Extra Text**: Return ONLY the raw JSON object string. Do not include any surrounding text, explanations, apologies, or markdown formatting (like \`\`\`json or \`\`\`). Your entire response will be parsed directly as JSON.
9.  **JSON Format Example:**
    {
      "existingKeyUntouched": "existing translation",
      "keyFromDiffUpdatedOrAdded": "new or updated translation here",
      "anotherExistingKeyUntouched": "another existing translation"
      // ... and so on for the entire file
    }
    
**Updated ${targetLocaleCode}.json:**
`;
  return prompt;
}

/**
 * Sends the prompt and context JSON to the Gemini API and retrieves the translation.
 * @param prompt The prompt string to send to the API.
 * @param currentLocaleJsonPath The path to the current target locale's JSON file.
 * @returns A promise that resolves to the text response from the API.
 * @throws Error if the API call fails or returns an empty/invalid response.
 */
export async function getTranslationsFromGemini(
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
      console.error(
        `Error reading context file ${currentLocaleJsonPath}:`,
        readError
      );
      throw new Error(
        `Failed to read context file ${currentLocaleJsonPath}: ${readError.message}`
      );
    } else {
      console.warn(
        `Context file not found: ${currentLocaleJsonPath}. Proceeding without context for this new file.`
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
    const result = await genAI.models.generateContent({
      model: MODEL_NAME,
      contents: contents,
      config: {
        temperature: 0.7,
        responseMimeType: "application/json",
        thinkingConfig: {
          thinkingBudget: 0,
        },
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
