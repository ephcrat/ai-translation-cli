export function getApiKey(): string {
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
