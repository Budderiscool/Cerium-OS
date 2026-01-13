
import React, { useState, useEffect, useMemo } from 'react';
import { APP_METADATA } from '../constants';
import { fsService } from '../services/fsService';
import { AppID } from '../types';

export const AppStore: React.FC = () => {
  const [installedApps, setInstalledApps] = useState<Set<AppID>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const checkInstallStatus = () => {
    const files = fsService.getFilesByParent('prog');
    const installed = new Set<AppID>();
    files.forEach(f => {
      const appId = f.name.replace('.exe', '') as AppID;
      if (APP_METADATA[appId]) {
        installed.add(appId);
      }
    });
    setInstalledApps(installed);
  };

  useEffect(() => {
    checkInstallStatus();
    window.addEventListener('fs_change', checkInstallStatus);
    return () => window.removeEventListener('fs_change', checkInstallStatus);
  }, []);

  const filteredApps = useMemo(() => {
    const apps = Object.keys(APP_METADATA) as AppID[];
    if (!searchTerm.trim()) return apps;
    const lower = searchTerm.toLowerCase();
    return apps.filter(id => id.toLowerCase().includes(lower) || APP_METADATA[id].description.toLowerCase().includes(lower));
  }, [searchTerm]);

  const handleInstall = (appId: AppID) => {
    fsService.saveFile({
      name: `${appId}.exe`,
      type: 'file',
      parentId: 'prog',
      extension: 'exe'
    });
    fsService.saveFile({
        name: `${appId.charAt(0).toUpperCase() + appId.slice(1)}.lnk`,
        type: 'file',
        parentId: 'desk',
        extension: 'lnk'
    });
  };

  const handleUninstall = (appId: AppID) => {
    const confirmed = window.confirm(`Are you sure you want to uninstall ${appId.charAt(0).toUpperCase() + appId.slice(1)}? This will delete the system binary.`);
    if (!confirmed) return;

    if (appId === 'appstore') {
        alert("Warning: Uninstalling the App Store will require manual terminal intervention to restore.");
    }
    const file = fsService.getFileByName(`${appId}.exe`, 'prog');
    if (file) {
      fsService.deleteFile(file.id);
    }
    // Also remove the desktop shortcut if it exists
    const shortcut = fsService.getFileByName(`${appId.charAt(0).toUpperCase() + appId.slice(1)}.lnk`, 'desk');
    if (shortcut) {
        fsService.deleteFile(shortcut.id);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white font-sans overflow-hidden">
      <div className="p-8 bg-gradient-to-br from-emerald-600/20 to-blue-600/20 border-b border-white/5 space-y-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">App Store</h1>
          <p className="text-white/60 text-sm">Manage your CeriumOS software package binaries.</p>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search applications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-5 pl-12 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-white/20"
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {filteredApps.map(appId => {
          const isInstalled = installedApps.has(appId);
          return (
            <div key={appId} className="flex items-center gap-4 p-4 glass-dark rounded-xl border border-white/5 hover:bg-white/5 transition-colors group">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-white/5 ${APP_METADATA[appId].color} group-hover:scale-105 transition-transform`}>
                {APP_METADATA[appId].icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold capitalize truncate">{appId}</h3>
                <p className="text-xs text-white/40 mb-1">Cerium Binary (.exe)</p>
                <p className="text-[11px] text-white/60 line-clamp-2">{APP_METADATA[appId].description}</p>
              </div>
              <div className="flex-shrink-0">
                {isInstalled ? (
                  <button 
                    onClick={() => handleUninstall(appId)}
                    className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Uninstall
                  </button>
                ) : (
                  <button 
                    onClick={() => handleInstall(appId)}
                    className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Install
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {filteredApps.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 opacity-30">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <p>No applications found matching your search.</p>
          </div>
        )}
      </div>
      
      <div className="p-4 bg-black/20 border-t border-white/5 text-[10px] text-white/30 uppercase tracking-widest text-center">
        Powered by Cerium VFS Package Manager
      </div>
    </div>
  );
};
