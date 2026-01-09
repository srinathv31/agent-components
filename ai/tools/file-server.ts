import { tool } from "ai";
import { z } from "zod";
import { listFiles, readFile } from "@/data/file-server";

export const listFilesTool = tool({
  description:
    "List all available documentation files on the file server. Use this tool to discover what documentation is available before reading specific content. Returns a list of files with their paths and descriptions.",
  inputSchema: z.object({}),
  execute: async () => {
    const { files } = await listFiles();
    return {
      files,
      hint: "You can now use the readFile tool with any file path to get its content.",
    };
  },
});

export const readFileTool = tool({
  description:
    "Read the content of a specific documentation file from the file server. Use the listFiles tool first to discover available file paths. Returns the full markdown content of the file.",
  inputSchema: z.object({
    filePath: z
      .string()
      .describe(
        "The full path to the file to read, e.g., '/docs/getting-started.md'"
      ),
  }),
  execute: async ({ filePath }) => {
    const { fileContent, metadata } = await readFile(filePath);
    return {
      fileContent,
      metadata,
    };
  },
});
