# AI Translation CLI

`ai-translation-cli` is a command-line tool built with Bun and the Google Gemini API to help automate the translation of i18n JSON locale files. It takes a `git diff` of your source language file (e.g., `en.json`), identifies the changes, and uses the Gemini API to translate those changes into one or more target languages, integrating them into the existing target locale files.

This tool is designed to streamline the localization process by leveraging AI for initial translations while using the context of existing translations to maintain coherence.

## Features

- Translate new or modified i18n keys based on a `git diff` of the source language file.
- Supports translation to a single specified target language or all other languages found in the `/locales` directory.
- Uses existing translations in target files as context for the AI to improve consistency.
- Creates new locale files if they don't exist for a target language.
- Pretty-prints output JSON files.

## Prerequisites

- [Bun](https://bun.sh) (JavaScript runtime, tested with v1.2.13 or higher)
- A Google Gemini API Key.
- A `git diff` file representing changes in your source language JSON.

## Setup

1.  **Clone the repository (if applicable) or set up the project files.**

2.  **Install dependencies:**

    ```bash
    bun install
    ```

3.  **Set up your Gemini API Key:**

    - Create a `.env` file in the root of the project.
    - Add your Gemini API key to this file:
      ```env
      GEMINI_API_KEY=YOUR_API_KEY_HERE
      ```
    - Ensure `.env` is listed in your `.gitignore` file (it is by default in this project).

4.  **Prepare your locale files:**

    - Place your source language JSON file (e.g., `en.json`) in a `/locales` directory in the project root.
    - (Optional) Add any existing target language JSON files (e.g., `es.json`, `fr.json`) to the `/locales` directory. The tool will create them if they don't exist.
    - Example `locales/en.json`:
      ```json
      {
        "greeting": "Hello, World!",
        "farewell": "Goodbye, World!"
      }
      ```

5.  **Generate a Git Diff File:**
    When you make changes to your source language file (e.g., `locales/en.json`), generate a diff file. For example:
    ```bash
    git diff locales/en.json > en_changes.diff.txt
    ```
    This `en_changes.diff.txt` will be used as input for the CLI.

## Usage

There are a couple of ways to run the CLI tool:

### Method 1: Using `bun run index.ts` (Recommended for simplicity within the project)

This method directly executes the entry point of the script using Bun.

**Translate to a specific language:**

```bash
bun run index.ts --diff <path_to_your_diff.txt> --lang <locale_code>
```

Example:

```bash
bun run index.ts --diff en_changes.diff.txt --lang es
```

**Translate to all other languages in the `/locales` directory (excluding the source language):**

```bash
bun run index.ts --diff <path_to_your_diff.txt>
```

Example:

```bash
bun run index.ts --diff en_changes.diff.txt
```

**Specify a different source language (default is `en`):**

```bash
bun run index.ts --diff <path_to_your_diff.txt> --source-lang fr --lang de
```

### Method 2: Using the `ai-translate` command directly

To use the `ai-translate` command directly from your terminal (like a globally installed CLI tool), you need to link the package using Bun and ensure Bun's global bin directory is in your shell's `PATH`.

1.  **Link the package (run these commands in the project root):**

    ```bash
    bun link
    bun link ai-translation-cli # Use your package name from package.json
    ```

    This makes the `ai-translate` binary (defined in `package.json`) available to Bun.

2.  **Update your Shell's PATH Variable:**
    The `ai-translate` command will be linked by Bun into its global binary directory (usually `~/.bun/bin`). For your shell to find this command, this directory must be in your `PATH`.

    - **For Zsh (common on macOS):**

      1.  Open your Zsh configuration file: `nano ~/.zshrc` (or use another editor).
      2.  Add this line to the file (usually at the end):
          ```bash
          export PATH="$HOME/.bun/bin:$PATH"
          ```
      3.  Save the file and exit the editor.
      4.  Apply the changes to your current shell session:
          ```bash
          source ~/.zshrc
          ```
          (Alternatively, open a new terminal tab/window.)

    - **For Bash (common on Linux and older macOS):**
      1.  Open your Bash configuration file: `nano ~/.bashrc` or `nano ~/.bash_profile`.
      2.  Add this line:
          ```bash
          export PATH="$HOME/.bun/bin:$PATH"
          ```
      3.  Save and exit.
      4.  Apply changes:
          ```bash
          source ~/.bashrc  # or source ~/.bash_profile
          ```
          (Alternatively, open a new terminal tab/window.)

3.  **Run the command:**
    Once linked and your `PATH` is updated, you can run the command directly:

    **Translate to a specific language:**

    ```bash
    ai-translate --diff <path_to_your_diff.txt> --lang <locale_code>
    ```

    Example:

    ```bash
    ai-translate --diff en_changes.diff.txt --lang es
    ```

    **Translate to all other languages:**

    ```bash
    ai-translate --diff <path_to_your_diff.txt>
    ```

### CLI Options

- `--diff <path>`: (Required) Path to the git diff `.txt` file of the source language JSON (e.g., `en.json`).
- `--lang <locale_code>`: (Optional) Target language locale code for translation (e.g., `es`, `fr`). If not provided, translates all other locales found in the locales directory (excluding the source language).
- `--source-lang <locale_code>`: (Optional) Source language locale code. Defaults to `en`.
- `--locales-path <path>`: (Optional) Path to the directory containing locale JSON files. Defaults to `./locales` (relative to where the command is run).

## Project Structure

- `/locales`: Contains all i18n JSON files (e.g., `en.json`, `es.json`).
- `/src`: Contains the TypeScript source code.
  - `cli.ts`: Main CLI logic, argument parsing.
  - `config.ts`: API key management.
  - `fileUtils.ts`: Utilities for reading/writing files.
  - `geminiService.ts`: Interaction with the Google Gemini API.
- `index.ts`: Executable entry point for the CLI.
- `test_diff.txt`: An example diff file for testing.

---

This project was initially set up using `bun init`. Bun is a fast all-in-one JavaScript runtime.
