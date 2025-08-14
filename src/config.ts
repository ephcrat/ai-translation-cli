import { config as dotenvConfig } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

let envLoaded = false;

function loadEnvFromPackageRoot(): void {
  if (envLoaded) return;
  envLoaded = true;
  try {
    const thisDir = path.dirname(fileURLToPath(import.meta.url));
    const projectRoot = path.resolve(thisDir, "..");
    // Load .env and .env.local from the package root without overriding existing env
    dotenvConfig({ path: path.join(projectRoot, ".env"), override: false });
    dotenvConfig({
      path: path.join(projectRoot, ".env.local"),
      override: false,
    });
  } catch {}
}

export function getGeminiApiKey(): string {
  loadEnvFromPackageRoot();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error(
      "Error: GEMINI_API_KEY is not set in the environment variables."
    );
    console.log(
      "Please create a .env file in the root of the project and add your API key:"
    );
    console.log("GEMINI_API_KEY=YOUR_API_KEY_HERE");
    process.exit(1);
  }
  return apiKey;
}

export function getOpenAIApiKey(): string {
  loadEnvFromPackageRoot();
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error(
      "Error: OPENAI_API_KEY is not set in the environment variables."
    );
    console.log(
      "Please create a .env file in the root of the project and add your API key:"
    );
    console.log("OPENAI_API_KEY=YOUR_API_KEY_HERE");
    process.exit(1);
  }
  return apiKey;
}
