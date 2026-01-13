
import React, { useState, useRef, useEffect } from 'react';
import { WindowState, AppID } from '../types';
import { APP_METADATA } from '../constants';

interface WindowProps {
  window: WindowState;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onMaximize: (id: string) => void;
  onFocus: (id: string) => void;
  onUpdatePosition: (id: string, x: number, y: number) => void;
  children: React.ReactNode;
}

export const Window: React.FC<WindowProps> = ({ 
  window, 
  onClose, 
  onMinimize, 
  onMaximize, 
  onFocus, 
  onUpdatePosition,
  children 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    onFocus(window.id);
    if ((e.target as HTMLElement).closest('.window-header')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - window.position.x,
        y: e.clientY - window.position.y
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && !window.isMaximized) {
        onUpdatePosition(window.id, e.clientX - dragOffset.x, e.clientY - dragOffset.y);
      }
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, window.id, window.isMaximized, onUpdatePosition]);

  if (window.isMinimized) return null;

  const style: React.CSSProperties = window.isMaximized 
    ? { top: 0, left: 0, width: '100%', height: 'calc(100% - 48px)', zIndex: window.zIndex }
    : { top: window.position.y, left: window.position.x, width: window.size.width, height: window.size.height, zIndex: window.zIndex };

  return (
    <div 
      ref={windowRef}
      style={style}
      className={`fixed flex flex-col glass-dark rounded-xl overflow-hidden shadow-2xl transition-all duration-300 ${isDragging ? 'opacity-90 scale-[1.01]' : 'opacity-100'}`}
      onMouseDown={handleMouseDown}
    >
      <div className="window-header h-10 flex items-center justify-between px-4 bg-white/5 border-b border-white/10 cursor-default">
        <div className="flex items-center gap-2">
          <div className={`${APP_METADATA[window.appId].color}`}>
            {React.cloneElement(APP_METADATA[window.appId].icon as React.ReactElement, { className: 'w-4 h-4' })}
          </div>
          <span className="text-white text-xs font-medium tracking-wide">{window.title}</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => onMinimize(window.id)}
            className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-md text-slate-400 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
          <button 
            onClick={() => onMaximize(window.id)}
            className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-md text-slate-400 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
          </button>
          <button 
            onClick={() => onClose(window.id)}
            className="w-8 h-8 flex items-center justify-center hover:bg-red-500/80 hover:text-white rounded-md text-slate-400 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-slate-900/30">
        {children}
      </div>
    </div>
  );
};
