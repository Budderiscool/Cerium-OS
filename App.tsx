
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { WindowState, AppID, OSConfig, IconPosition, PowerState, FileEntry } from './types';
import { APP_METADATA, DEFAULT_WALLPAPER } from './constants';
import { Window } from './components/Window';
import { StartMenu } from './components/StartMenu';
import { AIAssistant } from './apps/AIAssistant';
import { Terminal } from './apps/Terminal';
import { Paint } from './apps/Paint';
import { TaskManager } from './apps/TaskManager';
import { Explorer } from './apps/Explorer';
import { AppStore } from './apps/AppStore';
import { fsService } from './services/fsService';

const CONFIG_KEY = 'cerium_os_config';

const Login: React.FC<{ onLogin: (username: string, pass: string) => void, initialUser?: string }> = ({ onLogin, initialUser }) => {
  const [user, setUser] = useState(initialUser || '');
  const [pass, setPass] = useState('');
  
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
      <div className="absolute inset-0 bg-cover bg-center blur-lg opacity-40" style={{ backgroundImage: `url(${DEFAULT_WALLPAPER})` }}></div>
      <div className="relative glass-dark p-12 rounded-3xl w-96 flex flex-col items-center animate-in zoom-in-95 duration-500 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-6 ring-1 ring-white/20">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">CeriumOS</h1>
        <p className="text-white/50 text-xs mb-8">Welcome back to your workspace</p>
        <input 
          type="text" placeholder="Username" 
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white mb-4 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-white/20"
          value={user} onChange={e => setUser(e.target.value)}
        />
        <input 
          type="password" placeholder="Password" 
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white mb-6 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-white/20"
          value={pass} onChange={e => setPass(e.target.value)}
        />
        <button 
          onClick={() => user && onLogin(user, pass)}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl shadow-lg transition-all active:scale-[0.98]"
        >
          Login
        </button>
      </div>
    </div>
  );
};

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onAction: (action: string) => void;
  options?: string[];
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onClose, onAction, options }) => {
  useEffect(() => {
    const handleClose = () => onClose();
    window.addEventListener('click', handleClose);
    window.addEventListener('contextmenu', handleClose);
    return () => {
      window.removeEventListener('click', handleClose);
      window.removeEventListener('contextmenu', handleClose);
    };
  }, [onClose]);

  const defaultOptions = options || ['open', 'rename', 'copy', 'cut', 'delete', 'properties'];

  return (
    <div 
      className="fixed glass-dark rounded-lg shadow-2xl py-1 z-[2000] border border-white/10 min-w-[150px] animate-in fade-in zoom-in-95 duration-100"
      style={{ left: x, top: y }}
      onClick={e => e.stopPropagation()}
    >
      {defaultOptions.map((opt, i) => (
        <React.Fragment key={opt}>
          {['delete', 'properties', 'paste'].includes(opt) && <div className="h-[1px] bg-white/5 my-1" />}
          <button 
            onClick={() => { onAction(opt); onClose(); }} 
            className={`w-full text-left px-4 py-2 hover:bg-white/10 text-xs transition-colors capitalize ${
              opt === 'delete' ? 'text-rose-400 hover:bg-rose-500/20' : 'text-white'
            }`}
          >
            {opt}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};

const App: React.FC = () => {
  const [powerState, setPowerState] = useState<PowerState>('on');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  const [clipboard, setClipboard] = useState<{ id: string, type: 'copy' | 'cut' } | null>(null);
  const [systemError, setSystemError] = useState<string | null>(null);
  const [installedApps, setInstalledApps] = useState<Set<AppID>>(new Set());
  const [desktopFiles, setDesktopFiles] = useState<FileEntry[]>([]);
  
  const [config, setConfig] = useState<OSConfig>(() => {
    const saved = localStorage.getItem(CONFIG_KEY);
    if (saved) return JSON.parse(saved);
    return {
      wallpaper: DEFAULT_WALLPAPER,
      theme: 'dark',
      username: 'User',
      password: '',
      accentColor: '#4f46e5',
      iconPositions: {}
    };
  });
  
  const [time, setTime] = useState(new Date());
  const [draggingIcon, setDraggingIcon] = useState<string | null>(null);
  const [explorerContextMenu, setExplorerContextMenu] = useState<{ x: number, y: number, target: string, targetId: string, isBg?: boolean } | null>(null);

  const checkIntegrity = useCallback(() => {
    const files = fsService.getFiles();
    const ceriumFolder = files.find(f => f.id === 'cerium');
    if (!ceriumFolder) {
      setSystemError("CRITICAL_SYSTEM_ERROR: Cerium folder is missing. System integrity failure.");
    } else {
      setSystemError(null);
    }

    const progFiles = fsService.getFilesByParent('prog');
    const installed = new Set<AppID>();
    progFiles.forEach(f => {
      const appId = f.name.replace('.exe', '') as AppID;
      if (APP_METADATA[appId]) installed.add(appId);
    });
    setInstalledApps(installed);
    setDesktopFiles(fsService.getFilesByParent('desk'));
  }, []);

  useEffect(() => {
    checkIntegrity();
    window.addEventListener('fs_change', checkIntegrity);
    return () => window.removeEventListener('fs_change', checkIntegrity);
  }, [checkIntegrity]);

  useEffect(() => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const focusWindow = useCallback((id: string) => {
    setWindows(prev => {
      const maxZ = Math.max(...prev.map(w => w.zIndex), 10);
      return prev.map(w => w.id === id ? { ...w, zIndex: maxZ + 1, isMinimized: false } : w);
    });
  }, []);

  const launchApp = useCallback((appId: AppID) => {
    if (!installedApps.has(appId)) {
        alert(`Error: The application binary for ${appId} is missing. Please reinstall via App Store.`);
        return;
    }

    const existing = windows.find(w => w.appId === appId);
    if (existing) {
      focusWindow(existing.id);
      return;
    }

    const meta = APP_METADATA[appId];
    const newWindow: WindowState = {
      id: Math.random().toString(36).substr(2, 9),
      appId,
      title: appId.charAt(0).toUpperCase() + appId.slice(1),
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      zIndex: Math.max(...windows.map(w => w.zIndex), 10) + 1,
      position: { x: 100 + windows.length * 30, y: 100 + windows.length * 30 },
      size: { width: meta.defaultSize.w, height: meta.defaultSize.h }
    };
    setWindows(prev => [...prev, newWindow]);
  }, [windows, focusWindow, installedApps]);

  const closeWindow = (id: string) => setWindows(prev => prev.filter(w => w.id !== id));
  const minimizeWindow = (id: string) => setWindows(prev => prev.map(w => w.id === id ? { ...w, isMinimized: true } : w));
  const maximizeWindow = (id: string) => setWindows(prev => prev.map(w => w.id === id ? { ...w, isMaximized: !w.isMaximized } : w));
  const updatePosition = (id: string, x: number, y: number) => setWindows(prev => prev.map(w => w.id === id ? { ...w, position: { x, y } } : w));

  const handlePowerAction = (action: 'restart' | 'shutdown' | 'sleep') => {
    if (action === 'sleep') {
      setPowerState('sleep');
      setIsStartMenuOpen(false);
    } else if (action === 'restart') {
      setPowerState('restarting');
      setTimeout(() => {
        setPowerState('on');
        setIsLoggedIn(false);
        setWindows([]);
      }, 3000);
    } else {
      setPowerState('shutdown');
    }
  };

  const handleExplorerRightClick = (e: React.MouseEvent, target: string, targetId: string) => {
    e.preventDefault();
    setExplorerContextMenu({ x: e.clientX, y: e.clientY, target, targetId });
  };

  const handleExplorerBgRightClick = (e: React.MouseEvent, currentFolderId: string) => {
    e.preventDefault();
    setExplorerContextMenu({ x: e.clientX, y: e.clientY, target: 'background', targetId: currentFolderId, isBg: true });
  };

  const handleExplorerAction = (action: string, targetId: string) => {
    if (action === 'delete') {
      if (confirm(`Are you sure you want to delete this item?`)) {
        fsService.deleteFile(targetId);
      }
    } else if (action === 'rename') {
      const name = prompt('Enter new name:');
      if (name) fsService.saveFile({ id: targetId, name });
    } else if (action === 'copy' || action === 'cut') {
      setClipboard({ id: targetId, type: action as 'copy' | 'cut' });
    } else if (action === 'paste') {
      if (clipboard) {
        const item = fsService.getFileById(clipboard.id);
        if (item) {
          if (clipboard.type === 'copy') {
            fsService.saveFile({ 
              name: item.name + ' - Copy', 
              type: item.type, 
              parentId: targetId, 
              content: item.content, 
              extension: item.extension 
            });
          } else {
            fsService.saveFile({ id: item.id, parentId: targetId });
            setClipboard(null);
          }
        }
      }
    } else if (action === 'new file') {
      const name = prompt('File name:');
      if (name) fsService.saveFile({ name, type: 'file', parentId: targetId });
    } else if (action === 'new folder') {
      const name = prompt('Folder name:');
      if (name) fsService.saveFile({ name, type: 'folder', parentId: targetId });
    } else if (action === 'properties') {
      const item = fsService.getFileById(targetId);
      if (item) alert(`Properties:\nName: ${item.name}\nType: ${item.type}\nID: ${item.id}\nParent: ${item.parentId}`);
    }
  };

  if (powerState === 'shutdown') {
    return (
      <div className="fixed inset-0 z-[10000] bg-black flex flex-col items-center justify-center text-white font-mono text-center">
        <h1 className="text-3xl font-bold mb-4">Shutting down CeriumOS...</h1>
        <p className="opacity-40 animate-pulse">Safely unmounting virtual devices</p>
      </div>
    );
  }

  if (powerState === 'restarting') {
    return (
      <div className="fixed inset-0 z-[10000] bg-black flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-8"></div>
        <h1 className="text-3xl font-bold mb-4 tracking-widest uppercase">CeriumOS</h1>
      </div>
    );
  }

  if (powerState === 'sleep') {
    return (
      <div 
        className="fixed inset-0 z-[10000] bg-black cursor-none"
        onClick={() => setPowerState('on')}
      ></div>
    );
  }

  if (!isLoggedIn) {
    return <Login 
      initialUser={config.username}
      onLogin={(name, pass) => { 
        if (config.password && pass !== config.password) {
          alert("Incorrect password for " + name);
          return;
        }
        setIsLoggedIn(true); 
        setConfig(p => ({...p, username: name, password: p.password || pass})) 
      }} 
    />;
  }

  return (
    <div 
      className={`fixed inset-0 overflow-hidden bg-cover bg-center transition-all duration-700 ${systemError ? 'grayscale contrast-200' : ''}`}
      style={{ backgroundImage: `url(${config.wallpaper})` }}
      onClick={() => setIsStartMenuOpen(false)}
      onDragOver={(e) => e.preventDefault()}
    >
      {systemError && (
        <div className="absolute inset-0 z-[5000] bg-rose-900/40 flex flex-col items-center justify-center text-white p-20 pointer-events-none text-center">
            <h1 className="text-6xl font-black mb-4">SYSTEM CORRUPTED</h1>
            <p className="text-xl font-mono">{systemError}</p>
        </div>
      )}

      <div className="absolute inset-0 z-0">
        {desktopFiles.map((file, index) => {
          let appId: AppID | null = null;
          if (file.extension === 'lnk') {
              const nameLower = file.name.toLowerCase().replace('.lnk', '').replace(' ', '');
              if (APP_METADATA[nameLower]) appId = nameLower as AppID;
              else if (nameLower === 'ceriumai') appId = 'ai';
              else if (nameLower === 'texteditor') appId = 'notepad';
              else if (nameLower === 'fileexplorer') appId = 'explorer';
          }
          
          const iconId = file.id;
          const pos = config.iconPositions[iconId] || { x: 20, y: 20 + index * 100 };
          const isAppMissing = appId && !installedApps.has(appId);

          return (
            <div 
              key={iconId}
              draggable
              onDragStart={(e) => {
                setDraggingIcon(iconId);
                e.dataTransfer.setData('text/plain', '');
              }}
              onDragEnd={(e) => {
                const x = e.clientX - 40;
                const y = e.clientY - 40;
                setConfig(prev => ({
                  ...prev,
                  iconPositions: { ...prev.iconPositions, [iconId]: { x, y } }
                }));
                setDraggingIcon(null);
              }}
              className={`absolute flex flex-col items-center gap-1 p-2 rounded hover:bg-white/10 border border-transparent hover:border-white/10 transition-colors w-24 group cursor-pointer ${draggingIcon === iconId ? 'opacity-0' : 'opacity-100'}`}
              style={{ left: pos.x, top: pos.y }}
              onDoubleClick={() => appId ? launchApp(appId) : alert(`Opening ${file.name}`)}
            >
              <div className={`p-2 transition-transform drop-shadow-[0_0_10px_rgba(0,0,0,0.5)] ${appId ? APP_METADATA[appId].color : 'text-slate-200'} ${isAppMissing ? 'grayscale opacity-30' : 'group-hover:scale-110'}`}>
                {systemError ? <div className="w-8 h-8 bg-white border border-slate-300" /> : (appId ? APP_METADATA[appId].icon : (file.type === 'folder' ? <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg> : <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/></svg>))}
              </div>
              <span className="text-white text-[11px] font-medium drop-shadow-md text-center bg-black/40 px-1.5 py-0.5 rounded-sm truncate w-full">
                {file.name.replace('.lnk', '')}
                {isAppMissing && <span className="block text-[8px] text-rose-400">Missing binary</span>}
              </span>
            </div>
          );
        })}
      </div>

      {windows.map(win => (
        <Window
          key={win.id}
          window={win}
          onClose={closeWindow}
          onFocus={focusWindow}
          onMinimize={minimizeWindow}
          onMaximize={maximizeWindow}
          onUpdatePosition={updatePosition}
        >
          {win.appId === 'ai' && <AIAssistant />}
          {win.appId === 'terminal' && <Terminal />}
          {win.appId === 'paint' && <Paint />}
          {win.appId === 'appstore' && <AppStore />}
          {win.appId === 'taskmanager' && <TaskManager windows={windows} onCloseTask={closeWindow} />}
          {win.appId === 'explorer' && <Explorer onRightClick={handleExplorerRightClick} onBgRightClick={handleExplorerBgRightClick} isCorrupted={!!systemError} />}
          {win.appId === 'notepad' && (
            <textarea 
              className="w-full h-full p-4 bg-transparent text-white outline-none resize-none font-sans" 
              placeholder="Type something..."
              style={{ color: config.theme === 'dark' ? 'white' : 'black' }}
            ></textarea>
          )}
          {win.appId === 'settings' && (
            <div className="flex h-full text-white overflow-hidden">
               <div className="w-48 bg-black/20 border-r border-white/5 p-4 flex flex-col gap-2">
                  <button className="px-4 py-2 bg-white/10 rounded-lg text-left text-sm font-medium">System</button>
                  <button className="px-4 py-2 hover:bg-white/5 rounded-lg text-left text-sm opacity-60">Personalization</button>
                  <button className="px-4 py-2 hover:bg-white/5 rounded-lg text-left text-sm opacity-60">Display</button>
                  <button className="px-4 py-2 hover:bg-white/5 rounded-lg text-left text-sm opacity-60">About</button>
                  <div className="mt-auto pt-4 border-t border-white/5">
                    <button onClick={() => handlePowerAction('shutdown')} className="w-full px-4 py-2 text-rose-400 hover:bg-rose-500/10 rounded-lg text-left text-sm">Shut Down</button>
                  </div>
               </div>
               <div className="flex-1 p-8 overflow-y-auto">
                 <h2 className="text-2xl font-bold mb-8">System Settings</h2>
                 <div className="space-y-12">
                   <section>
                     <h3 className="text-sm font-bold uppercase text-white/40 mb-4 tracking-widest">Personalization</h3>
                     <div className="grid grid-cols-2 gap-6">
                       <div className="p-6 glass-dark rounded-2xl border border-white/5 space-y-4">
                          <label className="text-xs text-white/50 block">Accent Color</label>
                          <div className="flex gap-3">
                            {['#4f46e5', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6'].map(c => (
                              <button 
                                key={c}
                                onClick={() => setConfig(p => ({...p, accentColor: c}))}
                                className={`w-8 h-8 rounded-full border-2 transition-transform ${config.accentColor === c ? 'scale-110 border-white' : 'border-transparent'}`}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                       </div>
                       <div className="p-6 glass-dark rounded-2xl border border-white/5 space-y-4">
                          <label className="text-xs text-white/50 block">Wallpaper</label>
                          <div className="grid grid-cols-3 gap-2">
                             {['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe', 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e', 'https://images.unsplash.com/photo-1477346611705-65d1883cee1e'].map((url, i) => (
                               <img 
                                 key={i} 
                                 src={url + '?auto=format&fit=crop&q=80&w=100'} 
                                 onClick={() => setConfig(p => ({...p, wallpaper: url + '?auto=format&fit=crop&q=80&w=2564'}))}
                                 className="rounded-lg cursor-pointer hover:opacity-80 aspect-video object-cover" 
                               />
                             ))}
                          </div>
                       </div>
                     </div>
                   </section>
                 </div>
               </div>
            </div>
          )}
        </Window>
      ))}

      {isStartMenuOpen && (
        <StartMenu 
          onLaunchApp={launchApp} 
          onClose={() => setIsStartMenuOpen(false)} 
          username={config.username}
        />
      )}

      <div className="fixed bottom-0 left-0 right-0 h-12 glass shadow-2xl flex items-center justify-between px-2 z-[999] border-t border-white/5">
        <div className="flex items-center gap-1">
          <button 
            onClick={(e) => { e.stopPropagation(); setIsStartMenuOpen(!isStartMenuOpen); }}
            className={`w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all ${isStartMenuOpen ? 'bg-white/20' : ''}`}
            style={{ color: config.accentColor }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/></svg>
          </button>
          <div className="h-6 w-[1px] bg-white/10 mx-1"></div>
          {windows.map(win => (
            <button 
              key={win.id}
              onClick={() => focusWindow(win.id)}
              className={`w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all group relative ${win.isMinimized ? 'opacity-50' : 'bg-white/5 shadow-inner'}`}
            >
              <div className={`${APP_METADATA[win.appId].color}`}>
                {React.cloneElement(APP_METADATA[win.appId].icon as React.ReactElement, { className: 'w-5 h-5' })}
              </div>
              <div 
                className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full transition-all ${win.zIndex === Math.max(...windows.map(w => w.zIndex)) ? 'scale-100' : 'scale-0'}`}
                style={{ backgroundColor: config.accentColor }}
              ></div>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 px-3 text-white">
           <button onClick={() => launchApp('taskmanager')} className="p-2 hover:bg-white/10 rounded-lg transition-colors group">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white/40 group-hover:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
           </button>
           <div className="flex flex-col items-end cursor-default select-none group">
              <span className="text-[11px] font-medium group-hover:text-indigo-400 transition-colors">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span className="text-[10px] opacity-60 group-hover:opacity-100 transition-opacity">{time.toLocaleDateString()}</span>
           </div>
           <div className="w-1 h-8 bg-white/10 ml-2"></div>
        </div>
      </div>

      {explorerContextMenu && (
        <ContextMenu 
          x={explorerContextMenu.x} 
          y={explorerContextMenu.y} 
          onClose={() => setExplorerContextMenu(null)}
          onAction={(action) => handleExplorerAction(action, explorerContextMenu.targetId)}
          options={explorerContextMenu.isBg ? ['new file', 'new folder', 'paste'] : undefined}
        />
      )}
    </div>
  );
};

export default App;
