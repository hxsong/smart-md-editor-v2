export interface FileNode {
  id: string;
  name: string;
  kind: 'file' | 'directory';
  path: string; // Relative path from root
  handle: FileSystemFileHandle | FileSystemDirectoryHandle | null;
  children?: FileNode[];
  lastModified?: number;
  fileObject?: File; // For fallback mode
}

export interface FileSystemContextType {
  rootHandle: FileSystemDirectoryHandle | null;
  fileList: FileNode[];
  openDirectory: () => Promise<void>;
  readFile: (node: FileNode) => Promise<string>;
  saveFile: (node: FileNode, content: string) => Promise<void>;
  refreshDir: () => Promise<void>;
  currentFile: FileNode | null;
  setCurrentFile: (node: FileNode | null) => void;
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;
  isSupported: boolean;
}
