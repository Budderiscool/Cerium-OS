
import React from 'react';
import { WindowState } from '../types';
import { APP_METADATA } from '../constants';

interface TaskManagerProps {
  windows: WindowState[];
  onCloseTask: (id: string) => void;
}

export const TaskManager: React.FC<TaskManagerProps> = ({ windows, onCloseTask }) => {
  return (
    <div className="flex flex-col h-full bg-slate-900 text-white font-sans text-sm">
      <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-white/5">
        <h2 className="font-semibold">Processes</h2>
        <span className="text-xs text-slate-400">{windows.length} apps running</span>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-slate-800 text-xs text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">PID</th>
              <th className="px-4 py-2 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {windows.map(win => (
              <tr key={win.id} className="hover:bg-white/5 group">
                <td className="px-4 py-3 flex items-center gap-2">
                  <div className={APP_METADATA[win.appId].color}>
                    {React.cloneElement(APP_METADATA[win.appId].icon as React.ReactElement, { className: 'w-4 h-4' })}
                  </div>
                  {win.title}
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px]">Running</span>
                </td>
                <td className="px-4 py-3 font-mono text-xs opacity-50">{win.id}</td>
                <td className="px-4 py-3 text-right">
                  <button 
                    onClick={() => onCloseTask(win.id)}
                    className="text-rose-400 hover:text-rose-300 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    End Task
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 bg-slate-800/50 border-t border-white/5 flex gap-8">
        <div>
          <div className="text-[10px] text-slate-400 uppercase">CPU Usage</div>
          <div className="text-emerald-400 font-bold">12%</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-400 uppercase">Memory</div>
          <div className="text-blue-400 font-bold">1.4 GB</div>
        </div>
      </div>
    </div>
  );
};
