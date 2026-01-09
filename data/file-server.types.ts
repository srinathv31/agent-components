export interface FileInfo {
  path: string;
  name: string;
  type: "file" | "directory";
  description?: string;
}

export interface ListFilesResponse {
  files: FileInfo[];
}

export interface ReadFileResponse {
  fileContent: string;
  metadata?: {
    path: string;
    lastModified?: string;
  };
}
