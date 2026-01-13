
import React from 'react';
import { APP_METADATA } from '../constants';
import { AppID } from '../types';

interface StartMenuProps {
  onLaunchApp: (id: AppID) => void;
  onClose: () => void;
  username: string;
}

export const StartMenu: React.FC<StartMenuProps> = ({ onLaunchApp, onClose, username }) => {
  return (
    <div 
      className="fixed bottom-14 left-2 w-96 h-[500px] glass-dark rounded-xl shadow-2xl z-[1000] p-6 flex flex-col animate-in slide-in-from-bottom-4 duration-200"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
          {username[0]?.toUpperCase()}
        </div>
        <div>
          <h2 className="text-white font-semibold">{username}</h2>
          <p className="text-slate-400 text-xs text-emerald-400">Online</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">Pinned Apps</h3>
        <div className="grid grid-cols-3 gap-4">
          {(Object.keys(APP_METADATA) as AppID[]).map((appId) => (
            <button
              key={appId}
              onClick={() => { onLaunchApp(appId); onClose(); }}
              className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-white/10 transition-colors group"
            >
              <div className={`${APP_METADATA[appId].color} mb-2 group-hover:scale-110 transition-transform`}>
                {APP_METADATA[appId].icon}
              </div>
              <span className="text-white text-[11px] capitalize">{appId}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-white/10 flex justify-between items-center text-slate-400">
        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
        </button>
        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
      </div>
    </div>
  );
};
