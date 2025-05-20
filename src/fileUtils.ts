import fs from "fs/promises";
import path from "path";

/**
 * Reads and parses a JSON file from a given path.
 * @param filePath The path to the JSON file.
 * @returns A promise that resolves to the parsed JSON object.
 * @throws Error if the file is not found, cannot be read, or contains invalid JSON.
 */
export async function readJsonFile<T = any>(filePath: string): Promise<T> {
  try {
    const absolutePath = path.resolve(filePath);
    const fileContent = await fs.readFile(absolutePath, "utf-8");
    return JSON.parse(fileContent) as T;
  } catch (error: any) {
    if (error.code === "ENOENT") {
      throw new Error(`Error: File not found at ${filePath}`);
    }
    if (error instanceof SyntaxError) {
      throw new Error(
        `Error: Invalid JSON in file ${filePath}. ${error.message}`
      );
    }
    throw new Error(
      `Error reading or parsing file ${filePath}: ${error.message}`
    );
  }
}

/**
 * Writes JSON data to a file, pretty-printing it.
 * @param filePath The path to the file where JSON data will be written.
 * @param data The JSON data to write.
 * @throws Error if writing the file fails.
 */
export async function writeJsonFile(
  filePath: string,
  data: any
): Promise<void> {
  try {
    const absolutePath = path.resolve(filePath);
    // Ensure the directory exists
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    const jsonString = JSON.stringify(data, null, 2); // Pretty-print with 2-space indent
    await fs.writeFile(absolutePath, jsonString, "utf-8");
  } catch (error: any) {
    throw new Error(`Error writing JSON to file ${filePath}: ${error.message}`);
  }
}

/**
 * Reads the content of a text file.
 * @param filePath The path to the text file.
 * @returns A promise that resolves to the file content as a string.
 * @throws Error if the file is not found or cannot be read.
 */
export async function readTextFile(filePath: string): Promise<string> {
  try {
    const absolutePath = path.resolve(filePath);
    return await fs.readFile(absolutePath, "utf-8");
  } catch (error: any) {
    if (error.code === "ENOENT") {
      throw new Error(`Error: Text file not found at ${filePath}`);
    }
    throw new Error(`Error reading text file ${filePath}: ${error.message}`);
  }
}

/**
 * Lists the names of files in a given directory.
 * @param dirPath The path to the directory.
 * @returns A promise that resolves to an array of file names.
 * @throws Error if the directory cannot be read.
 */
export async function listDirectoryContents(
  dirPath: string
): Promise<string[]> {
  try {
    const absolutePath = path.resolve(dirPath);
    return await fs.readdir(absolutePath);
  } catch (error: any) {
    throw new Error(
      `Error listing directory contents for ${dirPath}: ${error.message}`
    );
  }
}
