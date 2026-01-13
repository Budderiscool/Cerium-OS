
import React, { useState, useRef, useEffect } from 'react';
import { fsService } from '../services/fsService';

export const Terminal: React.FC = () => {
  const [currentDirId, setCurrentDirId] = useState<string>('root');
  const [history, setHistory] = useState<string[]>([
    'CeriumOS Terminal [Version 1.0.0]',
    '(c) Cerium Corporation. All rights reserved.',
    '',
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [history]);

  const processCommand = (cmdStr: string) => {
    const args = cmdStr.trim().split(/\s+/);
    const cmd = args[0].toLowerCase();
    const params = args.slice(1);
    let response = '';

    const path = fsService.getPath(currentDirId);
    const prompt = `user@cerium:${path}$ ${cmdStr}`;

    switch (cmd) {
      case 'help':
        response = 'Available: ls, cd, mkdir, touch, rm, cat, clear, pwd, whoami, date, version';
        break;
      case 'ls':
        const files = fsService.getFilesByParent(currentDirId);
        response = files.map(f => f.type === 'folder' ? `[DIR] ${f.name}` : f.name).join('\n') || '(directory empty)';
        break;
      case 'pwd':
        response = path;
        break;
      case 'whoami':
        response = 'user';
        break;
      case 'date':
        response = new Date().toString();
        break;
      case 'version':
        response = 'CeriumOS Kernel 1.0.0-gold';
        break;
      case 'clear':
        setHistory([]);
        return;
      case 'mkdir':
        if (!params[0]) response = 'Usage: mkdir <dirname>';
        else {
          fsService.saveFile({ name: params[0], type: 'folder', parentId: currentDirId });
          response = `Created directory: ${params[0]}`;
        }
        break;
      case 'touch':
        if (!params[0]) response = 'Usage: touch <filename>';
        else {
          fsService.saveFile({ name: params[0], type: 'file', parentId: currentDirId, content: '' });
          response = `Created file: ${params[0]}`;
        }
        break;
      case 'rm':
        if (!params[0]) response = 'Usage: rm <name>';
        else {
          const target = fsService.getFileByName(params[0], currentDirId);
          if (target) {
            fsService.deleteFile(target.id);
            response = `Removed: ${params[0]}`;
          } else response = `rm: cannot remove '${params[0]}': No such file or directory`;
        }
        break;
      case 'cat':
        if (!params[0]) response = 'Usage: cat <filename>';
        else {
          const file = fsService.getFileByName(params[0], currentDirId);
          if (file && file.type === 'file') response = file.content || '(empty file)';
          else response = `cat: ${params[0]}: No such file or directory`;
        }
        break;
      case 'cd':
        if (!params[0] || params[0] === '/') setCurrentDirId('root');
        else if (params[0] === '..') {
          const current = fsService.getFileById(currentDirId);
          if (current?.parentId) setCurrentDirId(current.parentId);
        } else {
          const target = fsService.getFileByName(params[0], currentDirId);
          if (target && target.type === 'folder') setCurrentDirId(target.id);
          else response = `cd: ${params[0]}: No such directory`;
        }
        break;
      case '':
        setHistory(prev => [...prev, prompt]);
        return;
      default:
        response = `'${cmd}' is not recognized as an internal or external command.`;
    }

    setHistory(prev => [...prev, prompt, response, '']);
  };

  return (
    <div className="h-full bg-black/90 text-emerald-500 p-4 font-mono text-sm overflow-y-auto selection:bg-emerald-500/30 selection:text-white" ref={scrollRef}>
      {history.map((line, i) => (
        <div key={i} className="whitespace-pre-wrap mb-1 leading-relaxed">{line}</div>
      ))}
      <div className="flex">
        <span className="mr-2 text-emerald-400">user@cerium:{fsService.getPath(currentDirId)}$</span>
        <input
          autoFocus
          className="bg-transparent border-none outline-none flex-1 text-emerald-500 caret-emerald-400"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              processCommand(input);
              setInput('');
            }
          }}
        />
      </div>
    </div>
  );
};
