import { useState, useCallback, useEffect } from 'react';
import { FileNode } from '../types';

export const useFileSystem = () => {
  const [rootHandle, setRootHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [fileList, setFileList] = useState<FileNode[]>([]);
  const [currentFile, setCurrentFile] = useState<FileNode | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    setIsSupported('showDirectoryPicker' in window);
  }, []);

  const scanDirectory = async (dirHandle: FileSystemDirectoryHandle, path: string = ''): Promise<FileNode[]> => {
    const entries: FileNode[] = [];
    
    try {
      for await (const entry of dirHandle.values()) {
        // Skip hidden files/dirs (starting with .)
        if (entry.name.startsWith('.')) continue;

        const relativePath = path ? `${path}/${entry.name}` : entry.name;
        
        try {
          if (entry.kind === 'file') {
            if (entry.name.toLowerCase().endsWith('.md')) {
              const fileHandle = entry as FileSystemFileHandle;
              const file = await fileHandle.getFile();
              entries.push({
                id: relativePath,
                name: entry.name,
                kind: 'file',
                path: relativePath,
                handle: fileHandle,
                lastModified: file.lastModified
              });
            }
          } else if (entry.kind === 'directory') {
            const dirHandle = entry as FileSystemDirectoryHandle;
            const children = await scanDirectory(dirHandle, relativePath);
            entries.push({
              id: relativePath,
              name: entry.name,
              kind: 'directory',
              path: relativePath,
              handle: dirHandle,
              children: children.sort((a, b) => a.name.localeCompare(b.name))
            });
          }
        } catch (e) {
          console.warn(`Error processing entry ${entry.name}:`, e);
        }
      }
    } catch (e) {
      console.warn('Error scanning directory:', e);
    }
    
    // Sort: directories first, then files
    return entries.sort((a, b) => {
      if (a.kind === b.kind) return a.name.localeCompare(b.name);
      return a.kind === 'directory' ? -1 : 1;
    });
  };

  const openFileLegacy = (): Promise<File[]> => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.md';
      input.onchange = (e) => {
        const files = (e.target as HTMLInputElement).files;
        resolve(files ? Array.from(files) : []);
      };
      input.click();
    });
  };

  const openDirectory = useCallback(async () => {
    if (!isSupported) {
      // Fallback: Open File directly
      const files = await openFileLegacy();
      if (files.length > 0) {
        const file = files[0];
        const node: FileNode = {
            id: file.name,
            name: file.name,
            kind: 'file',
            path: file.name,
            handle: null,
            lastModified: file.lastModified,
            fileObject: file
        };
        setFileList([node]);
        setCurrentFile(node);
      }
      return;
    }

    try {
      const handle = await window.showDirectoryPicker();
      setRootHandle(handle);
      const list = await scanDirectory(handle);
      setFileList(list);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User cancelled, ignore
        console.log('User cancelled directory picker');
        return;
      }
      console.error('Error opening directory:', err);
    }
  }, [isSupported]);

  const refreshDir = useCallback(async () => {
    if (rootHandle) {
      const list = await scanDirectory(rootHandle);
      setFileList(list);
    }
  }, [rootHandle]);

  const readFile = useCallback(async (node: FileNode): Promise<string> => {
    if (node.kind !== 'file') throw new Error('Not a file');
    
    if (node.fileObject) {
        return await node.fileObject.text();
    }

    const handle = node.handle as FileSystemFileHandle;
    const file = await handle.getFile();
    return await file.text();
  }, []);

  const saveFile = useCallback(async (node: FileNode, content: string) => {
    if (node.kind !== 'file') throw new Error('Not a file');

    if (!isSupported || !node.handle) {
        // Fallback: Download
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = node.name;
        a.click();
        URL.revokeObjectURL(url);
        return;
    }

    if (!rootHandle) throw new Error('Root not open');

    try {
      // 1. Resolve Parent Directory Handle
      const pathParts = node.path.split('/');
      const fileName = pathParts.pop()!;
      let currentDir = rootHandle;
      
      for (const part of pathParts) {
        currentDir = await currentDir.getDirectoryHandle(part);
      }

      // 2. Create Backup (.md.bak)
      // Get original content first
      const fileHandle = node.handle as FileSystemFileHandle;
      const file = await fileHandle.getFile();
      const oldContent = await file.text();

      const backupHandle = await currentDir.getFileHandle(`${fileName}.bak`, { create: true });
      const backupWritable = await backupHandle.createWritable();
      await backupWritable.write(oldContent);
      await backupWritable.close();

      // 3. Atomic Write
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();

      // 4. Refresh directory to update last modified time
      await refreshDir();
      
    } catch (err) {
      console.error('Error saving file:', err);
      throw err;
    }
  }, [rootHandle, refreshDir, isSupported]);

  return {
    rootHandle,
    fileList,
    openDirectory,
    readFile,
    saveFile,
    refreshDir,
    currentFile,
    setCurrentFile,
    isDirty,
    setIsDirty,
    isSupported
  };
};
