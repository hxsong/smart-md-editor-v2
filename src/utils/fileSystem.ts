
export interface FileEntry {
  name: string;
  path: string; // Relative path from root
  kind: 'file' | 'directory';
  handle: FileSystemHandle;
  children?: FileEntry[];
}

export async function verifyPermission(
  fileHandle: FileSystemHandle,
  readWrite: boolean
) {
  const options: FileSystemHandlePermissionDescriptor = {};
  if (readWrite) {
    options.mode = 'readwrite';
  }
  if ((await fileHandle.queryPermission(options)) === 'granted') {
    return true;
  }
  if ((await fileHandle.requestPermission(options)) === 'granted') {
    return true;
  }
  return false;
}

export async function getDirEntries(
  dirHandle: FileSystemDirectoryHandle,
  path: string = ''
): Promise<FileEntry[]> {
  const entries: FileEntry[] = [];
  // @ts-ignore - TS definition might be missing entries() iterator in some versions
  for await (const [name, handle] of dirHandle.entries()) {
    const currentPath = path ? `${path}/${name}` : name;
    if (handle.kind === 'file') {
      if (name.endsWith('.md')) {
        entries.push({
          name,
          path: currentPath,
          kind: 'file',
          handle: handle as FileSystemFileHandle,
        });
      }
    } else if (handle.kind === 'directory') {
      // Recursively get children
      const children = await getDirEntries(
        handle as FileSystemDirectoryHandle,
        currentPath
      );
      // Only add directory if it contains md files or subdirectories with md files
      if (children.length > 0) {
        entries.push({
          name,
          path: currentPath,
          kind: 'directory',
          handle: handle as FileSystemDirectoryHandle,
          children: children.sort((a, b) => a.name.localeCompare(b.name)),
        });
      }
    }
  }
  return entries.sort((a, b) => {
    if (a.kind === b.kind) {
      return a.name.localeCompare(b.name);
    }
    return a.kind === 'directory' ? -1 : 1;
  });
}

export async function readFile(fileHandle: FileSystemFileHandle): Promise<string> {
  const file = await fileHandle.getFile();
  return await file.text();
}

export async function saveFile(
  fileHandle: FileSystemFileHandle,
  content: string
): Promise<void> {
  // File System Access API createWritable() acts on the file directly. 
  // The API spec says `createWritable` returns a stream to a swap file, and `close()` atomically swaps it.
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}
