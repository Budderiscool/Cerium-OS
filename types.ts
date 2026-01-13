
export type AppID = 'explorer' | 'notepad' | 'terminal' | 'paint' | 'settings' | 'ai' | 'browser' | 'taskmanager' | 'appstore';

export interface WindowState {
  id: string;
  appId: AppID;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  position: { x: number; y: number };
  size: { width: number | string; height: number | string };
}

export interface FileEntry {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  parentId: string | null;
  extension?: string;
}

export interface IconPosition {
  x: number;
  y: number;
}

export interface OSConfig {
  wallpaper: string;
  theme: 'light' | 'dark';
  username: string;
  password?: string;
  accentColor: string;
  iconPositions: Record<string, IconPosition>;
}

export type PowerState = 'on' | 'sleep' | 'restarting' | 'shutdown';
