import type { ListFilesResponse, ReadFileResponse } from "./file-server.types";

const API_BASE = "http://localhost:3000/api/file-server";

export async function listFiles(): Promise<ListFilesResponse> {
  const response = await fetch(`${API_BASE}?action=list`);

  if (!response.ok) {
    throw new Error(`Failed to list files: ${response.statusText}`);
  }

  return response.json();
}

export async function readFile(filePath: string): Promise<ReadFileResponse> {
  const response = await fetch(
    `${API_BASE}?action=read&filePath=${encodeURIComponent(filePath)}`
  );

  if (!response.ok) {
    throw new Error(`Failed to read file: ${response.statusText}`);
  }

  return response.json();
}
