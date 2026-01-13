
import React, { useState, useEffect, useMemo } from 'react';
import { fsService } from '../services/fsService';
import { FileEntry } from '../types';

interface ExplorerProps {
  onRightClick: (e: React.MouseEvent, target: string, id: string) => void;
  onBgRightClick: (e: React.MouseEvent, currentFolderId: string) => void;
  isCorrupted?: boolean;
}

const getFileIcon = (file: FileEntry, isCorrupted: boolean) => {
  if (isCorrupted) {
    return <div className="w-10 h-10 bg-white border border-slate-300 shadow-sm" />;
  }

  if (file.type === 'folder') {
    return <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>;
  }

  const ext = file.extension?.toLowerCase();
  
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext || '')) {
    return <svg className="w-10 h-10 text-pink-400" viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>;
  }
  
  if (['mp4', 'mkv', 'avi'].includes(ext || '')) {
    return <svg className="w-10 h-10 text-rose-400" viewBox="0 0 24 24" fill="currentColor"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>;
  }

  if (['js', 'ts', 'html', 'css', 'json', 'md'].includes(ext || '')) {
    return <svg className="w-10 h-10 text-yellow-400" viewBox="0 0 24 24" fill="currentColor"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>;
  }

  if (ext === 'exe' || ext === 'sys') {
    return <svg className="w-10 h-10 text-emerald-400" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2v8h8V2h-8zm6 6h-4V4h4v4zm-6 12h8v-8h-8v8zm2-6h4v4h-4v-4zM2 10h8V2H2v8zm2-6h4v4H4V4zm-2 16h8v-8H2v8zm2-6h4v4H4v-4z"/></svg>;
  }

  return <svg className="w-10 h-10 text-slate-300" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/><path d="M14 2v6h6"/></svg>;
};

export const Explorer: React.FC<ExplorerProps> = ({ onRightClick, onBgRightClick, isCorrupted = false }) => {
  const [currentFolderId, setCurrentFolderId] = useState<string>('desk');
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const refreshFiles = () => {
    setFiles(fsService.getFilesByParent(currentFolderId));
  };

  useEffect(() => {
    refreshFiles();
    window.addEventListener('fs_change', refreshFiles);
    return () => window.removeEventListener('fs_change', refreshFiles);
  }, [currentFolderId]);

  const filteredFiles = useMemo(() => {
    if (!searchTerm.trim()) return files;
    const lowerSearch = searchTerm.toLowerCase();
    return files.filter(file => file.name.toLowerCase().includes(lowerSearch));
  }, [files, searchTerm]);

  const handleBack = () => {
    const current = fsService.getFileById(currentFolderId);
    if (current?.parentId) setCurrentFolderId(current.parentId);
  };

  const handleOpen = (file: FileEntry) => {
    if (file.type === 'folder') {
      setCurrentFolderId(file.id);
      setSearchTerm('');
    } else {
      console.log('Opening file:', file.name);
    }
  };

  return (
    <div 
      className="flex flex-col h-full bg-slate-900/90 text-white font-sans overflow-hidden"
      onContextMenu={(e) => onBgRightClick(e, currentFolderId)}
    >
      {/* Navigation Bar */}
      <div className="h-14 bg-white/5 border-b border-white/10 flex items-center px-4 gap-4" onContextMenu={e => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleBack}
            disabled={currentFolderId === 'root'}
            className={`p-1.5 rounded hover:bg-white/10 transition-colors ${currentFolderId === 'root' ? 'opacity-30' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button 
            onClick={refreshFiles}
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.85.83 6.71 2.24L21 8"/><path d="M21 3v5h-5"/></svg>
          </button>
        </div>

        <div className="flex-1 max-w-xl h-9 bg-black/40 border border-white/10 rounded-lg flex items-center px-3 gap-2 group focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input 
            type="text"
            placeholder={`Search in ${fsService.getFileById(currentFolderId)?.name || 'folder'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none text-xs flex-1 text-white placeholder:text-white/20"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-white/30 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => {
              const name = prompt('File name (e.g. image.png):');
              if (name) fsService.saveFile({ name, type: 'file', parentId: currentFolderId });
            }}
            className="p-1.5 rounded hover:bg-white/10 text-emerald-400 transition-colors"
            title="New File"
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
          </button>
          <button 
            onClick={() => {
              const name = prompt('Folder name:');
              if (name) fsService.saveFile({ name, type: 'folder', parentId: currentFolderId });
            }}
            className="p-1.5 rounded hover:bg-white/10 text-indigo-400 transition-colors"
            title="New Folder"
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/><line x1="12" y1="10" x2="12" y2="16"/><line x1="9" y1="13" x2="15" y2="13"/></svg>
          </button>
        </div>
      </div>

      {/* Path Breadcrumbs */}
      <div className="px-4 py-1 bg-white/5 flex items-center gap-1 text-[10px] text-white/40 overflow-hidden whitespace-nowrap">
        {fsService.getPath(currentFolderId).split('/').map((part, i, arr) => (
          <React.Fragment key={i}>
            <span className="hover:text-white cursor-pointer transition-colors" onClick={() => {}}>{part || 'root'}</span>
            {i < arr.length - 1 && <span>/</span>}
          </React.Fragment>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6">
          {filteredFiles.map((file) => (
            <div 
              key={file.id}
              onDoubleClick={(e) => { e.stopPropagation(); handleOpen(file); }}
              onContextMenu={(e) => { e.stopPropagation(); onRightClick(e, file.name, file.id); }}
              className="flex flex-col items-center gap-2 p-2 hover:bg-white/5 rounded-xl cursor-pointer group transition-all"
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                file.type === 'folder' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-500/10'
              }`}>
                {getFileIcon(file, isCorrupted)}
              </div>
              <span className="text-white text-[11px] font-medium text-center truncate w-full px-1">{file.name}</span>
            </div>
          ))}
          {filteredFiles.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-20">
               <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
               <span className="text-sm">{searchTerm ? `No results for "${searchTerm}"` : 'This folder is empty'}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="h-8 bg-black/20 border-t border-white/5 flex items-center px-4 text-[10px] text-white/40">
        {filteredFiles.length} item{filteredFiles.length !== 1 ? 's' : ''} {searchTerm && `(filtered from ${files.length})`}
      </div>
    </div>
  );
};
