// Tool argument type definitions for MCP tool calls

export interface ListDirArgs {
  path?: string;
}

export interface ListFilesArgs {
  path?: string;
  extension?: string;
}

export interface ReadFileArgs {
  path: string;
}

export interface WriteFileArgs {
  path: string;
  content: string;
  mode?: 'create' | 'overwrite' | 'append';
}

export interface SearchArgs {
  query: string;
  case_sensitive?: boolean;
  regex?: boolean;
  max_results?: number;
}

export interface MoveFileArgs {
  source: string;
  destination: string;
  overwrite?: boolean;
}

export interface DeleteFileArgs {
  path: string;
  confirm?: boolean;
  permanent?: boolean;
}

export interface DeleteFolderArgs {
  path: string;
  confirm?: boolean;
  permanent?: boolean;
}

export interface FindFilesArgs {
  query: string;
  fuzzy?: boolean;
  max_results?: number;
}

export interface GetFileInfoArgs {
  path: string;
}

export interface FileInfoData {
  path: string;
  size: number;
  modified: string;
  exists: boolean;
}

export interface CreateDirectoryArgs {
  path: string;
}

export interface CreateDirectoryData {
  path: string;
  created: boolean;
  message: string;
}

export interface EditFileArgs {
  path: string;
  old_string: string;
  new_string: string;
  replace_all?: boolean;
}
