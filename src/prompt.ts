export function constructTranslationPrompt(
  gitDiff: string,
  targetLocaleCode: string,
  targetLanguageName: string
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
    }
    
**Updated ${targetLocaleCode}.json:**
`;
  return prompt;
}

export function constructDeltaPrompt(
  gitDiff: string,
  targetLocaleCode: string,
  targetLanguageName: string
): string {
  const prompt = `
You're an expert translator for mobile and web applications, you know the best practices of internationalization and localization.

You will be provided with two pieces of information:
1. A git diff of an English JSON locale file, showing new or updated text.
2. The complete current JSON content for the target language (${targetLanguageName} - ${targetLocaleCode}.json) as a separate file.

Your task is to translate ONLY the new and updated English text from the git diff into ${targetLanguageName} (${targetLocaleCode}) and return a JSON object that contains ONLY the keys that were added or modified and their ${targetLanguageName} translations. Do not return the entire file.

Important context: The ${targetLanguageName} JSON file is provided to preserve style, tone, and terminology. Do not re-translate keys that are not in the diff.

Git Diff of en.json (source of new/updated English text):
\`\`\`diff
${gitDiff}
\`\`\`

CRITICAL Instructions - Follow These Precisely:
1. Identify the keys added or modified by the diff. Ignore deletions.
2. Translate ONLY those keys into ${targetLanguageName}.
3. Do NOT include any keys that are unchanged or deleted.
4. Preserve placeholders (e.g., {{variable}} or <tag>) exactly as they appear in English.
5. Return a valid JSON object containing ONLY the translated key-value pairs that correspond to additions or modifications.
6. Do NOT include any extra text, markdown, or explanations.

JSON Output Example (delta only):
{
  "new.key.or.modified": "translated value"
}
`;
  return prompt;
}
