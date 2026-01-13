
import { FileEntry } from '../types.ts';

const FS_KEY = 'cerium_os_fs';

const generateSystemFiles = (parentId: string, prefix: string, count: number, ext: string) => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `sys_${prefix}_${i}`,
    name: `${prefix}_${i.toString().padStart(3, '0')}.${ext}`,
    type: 'file' as const,
    parentId,
    extension: ext,
    content: '[HEX DATA]'
  }));
};

const INITIAL_FS: FileEntry[] = [
  { id: 'root', name: 'root', type: 'folder', parentId: null },
  { id: 'cerium', name: 'Cerium', type: 'folder', parentId: 'root' },
  { id: 'core', name: 'Core', type: 'folder', parentId: 'cerium' },
  { id: 'drivers', name: 'drivers', type: 'folder', parentId: 'cerium' },
  { id: 'logs', name: 'Logs', type: 'folder', parentId: 'cerium' },
  { id: 'prog', name: 'Program Files', type: 'folder', parentId: 'root' },
  { id: 'users', name: 'Users', type: 'folder', parentId: 'root' },
  { id: 'curruser', name: 'User', type: 'folder', parentId: 'users' },
  { id: 'docs', name: 'Documents', type: 'folder', parentId: 'curruser' },
  { id: 'pics', name: 'Pictures', type: 'folder', parentId: 'curruser' },
  { id: 'music', name: 'Music', type: 'folder', parentId: 'curruser' },
  { id: 'vids', name: 'Videos', type: 'folder', parentId: 'curruser' },
  { id: 'desk', name: 'Desktop', type: 'folder', parentId: 'curruser' },
  { id: 'down', name: 'Downloads', type: 'folder', parentId: 'curruser' },
  
  // App Binaries in Program Files (Installed by default)
  { id: 'bin_explorer', name: 'explorer.exe', type: 'file', parentId: 'prog', extension: 'exe' },
  { id: 'bin_notepad', name: 'notepad.exe', type: 'file', parentId: 'prog', extension: 'exe' },
  { id: 'bin_terminal', name: 'terminal.exe', type: 'file', parentId: 'prog', extension: 'exe' },
  { id: 'bin_paint', name: 'paint.exe', type: 'file', parentId: 'prog', extension: 'exe' },
  { id: 'bin_settings', name: 'settings.exe', type: 'file', parentId: 'prog', extension: 'exe' },
  { id: 'bin_ai', name: 'ai.exe', type: 'file', parentId: 'prog', extension: 'exe' },
  { id: 'bin_taskmanager', name: 'taskmanager.exe', type: 'file', parentId: 'prog', extension: 'exe' },
  { id: 'bin_appstore', name: 'appstore.exe', type: 'file', parentId: 'prog', extension: 'exe' },

  // Desktop App Shortcuts
  { id: 'desk_explorer', name: 'File Explorer.lnk', type: 'file', parentId: 'desk', extension: 'lnk' },
  { id: 'desk_terminal', name: 'Terminal.lnk', type: 'file', parentId: 'desk', extension: 'lnk' },
  { id: 'desk_ai', name: 'Cerium AI.lnk', type: 'file', parentId: 'desk', extension: 'lnk' },
  { id: 'desk_appstore', name: 'App Store.lnk', type: 'file', parentId: 'desk', extension: 'lnk' },
  { id: 'desk_notepad', name: 'Text Editor.lnk', type: 'file', parentId: 'desk', extension: 'lnk' },

  // Core System Files
  ...generateSystemFiles('core', 'kernel', 50, 'sys'),
  ...generateSystemFiles('core', 'lib', 80, 'dll'),
  ...generateSystemFiles('drivers', 'input', 15, 'sys'),
  ...generateSystemFiles('logs', 'boot', 40, 'log'),
];

export const fsService = {
  getFiles: (): FileEntry[] => {
    try {
      const data = localStorage.getItem(FS_KEY);
      if (!data || data === "undefined") {
        localStorage.setItem(FS_KEY, JSON.stringify(INITIAL_FS));
        return INITIAL_FS;
      }
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) throw new Error("FS is not an array");
      return parsed;
    } catch (e) {
      console.error("Cerium VFS Error: Disk corrupted, resetting to defaults.", e);
      localStorage.setItem(FS_KEY, JSON.stringify(INITIAL_FS));
      return INITIAL_FS;
    }
  },

  getFilesByParent: (parentId: string | null): FileEntry[] => {
    const files = fsService.getFiles();
    return files.filter(f => f.parentId === parentId);
  },

  getFileById: (id: string): FileEntry | undefined => {
    return fsService.getFiles().find(f => f.id === id);
  },

  getFileByName: (name: string, parentId: string | null): FileEntry | undefined => {
    return fsService.getFiles().find(f => f.name === name && f.parentId === parentId);
  },

  saveFile: (file: Partial<FileEntry>) => {
    const files = fsService.getFiles();
    const existingIndex = files.findIndex(f => f.id === file.id);
    
    if (existingIndex > -1) {
      files[existingIndex] = { ...files[existingIndex], ...file };
    } else {
      const name = file.name || 'Untitled';
      const parts = name.split('.');
      const extension = file.extension || (parts.length > 1 ? parts.pop() : (file.type === 'file' ? 'txt' : undefined));
      
      const newFile: FileEntry = {
        id: Math.random().toString(36).substr(2, 9),
        name: name,
        type: file.type || 'file',
        parentId: file.parentId || 'root',
        content: file.content || '',
        extension: extension
      };
      files.push(newFile);
    }
    localStorage.setItem(FS_KEY, JSON.stringify(files));
    window.dispatchEvent(new Event('fs_change'));
  },

  deleteFile: (id: string) => {
    if (id === 'root') return;
    const files = fsService.getFiles();
    const toDelete = new Set([id]);
    const findChildren = (pid: string) => {
      files.filter(f => f.parentId === pid).forEach(child => {
        toDelete.add(child.id);
        if (child.type === 'folder') findChildren(child.id);
      });
    };
    findChildren(id);
    
    const filtered = files.filter(f => !toDelete.has(f.id));
    localStorage.setItem(FS_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new Event('fs_change'));
  },

  getPath: (folderId: string | null): string => {
    if (!folderId || folderId === 'root') return '/';
    const files = fsService.getFiles();
    const parts: string[] = [];
    let current = files.find(f => f.id === folderId);
    while (current && current.id !== 'root') {
      parts.unshift(current.name);
      current = files.find(f => f.id === current?.parentId);
    }
    return '/' + parts.join('/');
  }
};
