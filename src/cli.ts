import { Command } from "commander";
import path from "path";
import {
  readJsonFile,
  writeJsonFile,
  readTextFile,
  listDirectoryContents,
} from "./fileUtils";
import { constructPrompt, getTranslationsFromGemini } from "./geminiService";

const program = new Command();

program
  .name("ai-translate")
  .description("CLI tool to translate i18n JSON files using Gemini API")
  .version("0.0.1");

program
  .requiredOption(
    "--diff <path>",
    "Path to the git diff .txt file of the source language JSON (e.g., en.json)"
  )
  .option(
    "--lang <locale_code>",
    "Target language locale code for translation (e.g., es, fr). If not provided, translates all other locales found."
  )
  .option(
    "--source-lang <locale_code>",
    'Source language locale code (defaults to "en")',
    "en"
  )
  .option(
    "--locales-path <path>",
    "Path to the directory containing locale JSON files (defaults to ./locales)",
    "./locales" // Default value
  );

program.parse(process.argv);

const options = program.opts();

async function main() {
  console.log("Starting AI Translation CLI...");
  console.log("Options:", options);

  try {
    console.log(`Reading diff file from: ${options.diff}`);
    const diffContent = await readTextFile(options.diff);
    console.log("\nDiff content loaded successfully.\n");

    let targetLocaleCodes: string[] = [];
    const localesPath = options.localesPath;

    if (options.lang) {
      targetLocaleCodes = [options.lang];
      console.log(`Target language specified: ${options.lang}`);
    } else {
      console.log(
        `No target language specified, scanning ${localesPath} for all languages...`
      );
      const allLocales = await listDirectoryContents(localesPath);
      targetLocaleCodes = allLocales
        .filter(
          (file) =>
            file.endsWith(".json") && file !== `${options.sourceLang}.json`
        )
        .map((file) => file.replace(".json", ""));
      if (targetLocaleCodes.length === 0) {
        console.warn(
          `No target locale files found in ${localesPath} (excluding ${options.sourceLang}.json). Exiting.`
        );
        process.exit(0);
      }
      console.log(`Found target languages: ${targetLocaleCodes.join(", ")}`);
    }

    for (const localeCode of targetLocaleCodes) {
      console.log(`\n--- Starting translation for ${localeCode} ---`);
      const targetFilePath = path.join(localesPath, `${localeCode}.json`);
      let currentLocaleJson = {};
      try {
        currentLocaleJson = await readJsonFile(targetFilePath);
        console.log(`Loaded existing translations from ${targetFilePath}`);
      } catch (error: any) {
        if (error.message.includes("File not found")) {
          console.log(
            `No existing file found for ${localeCode} at ${targetFilePath}. Starting with an empty JSON object.`
          );
        } else {
          throw error;
        }
      }

      const prompt = constructPrompt(
        diffContent,
        JSON.stringify(currentLocaleJson),
        localeCode,
        localeCode
      );

      console.log(`Sending request to Gemini API for ${localeCode}...`);
      const geminiResponseString = await getTranslationsFromGemini(prompt);

      console.log(`Received response from Gemini for ${localeCode}.`);

      let updatedTranslations;
      try {
        updatedTranslations = JSON.parse(geminiResponseString);
      } catch (e) {
        console.error(
          `Error: Gemini API response for ${localeCode} was not valid JSON. Skipping update for this language.`
        );
        console.error(`Received: ${geminiResponseString}`);
        console.error(e);
        continue;
      }

      await writeJsonFile(targetFilePath, updatedTranslations);
      console.log(`Successfully updated ${targetFilePath}`);
    }

    console.log("\nAll translations processed.");
  } catch (error: any) {
    console.error(`Error in main execution: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Unhandled error in main function:", err);
  if (err.stack) {
    console.error(err.stack);
  }
  process.exit(1);
});
