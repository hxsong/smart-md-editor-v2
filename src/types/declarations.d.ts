declare module 'html2pdf.js';

declare module 'tablesort' {
  export default function tablesort(el: HTMLElement, options?: any): void;
}

declare module 'markdown-it-footnote';
declare module 'markdown-it-task-lists';
declare module 'markdown-it-table-of-contents';
declare module 'markdown-it-texmath';
declare module 'plantuml-encoder' {
  export function encode(text: string): string;
}

declare module '*?worker' {
  const workerConstructor: {
    new (): Worker;
  };
  export default workerConstructor;
}

interface Window {
  showDirectoryPicker(): Promise<FileSystemDirectoryHandle>;
}

interface FileSystemDirectoryHandle {
  values(): AsyncIterableIterator<FileSystemHandle>;
}

interface FileSystemHandlePermissionDescriptor {
  mode?: 'read' | 'readwrite';
}

interface FileSystemHandle {
  queryPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
  requestPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
}
