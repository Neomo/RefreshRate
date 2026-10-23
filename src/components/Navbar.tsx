import React from 'react';
import { Play, Square, Sun, Moon, Award, GitCompare } from 'lucide-react';

interface NavbarProps {
  isTesting: boolean;
  onToggleTest: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenReport: () => void;
  onOpenHistory: () => void;
  activeSection: string;
  onSelectSection: (section: string) => void;
  historyCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  isTesting,
  onToggleTest,
  isDark,
  onToggleTheme,
  onOpenReport,
  onOpenHistory,
  activeSection,
  onSelectSection,
  historyCount,
}) => {
  return (
    <header className={`sticky top-0 z-40 flex items-center justify-between gap-8 px-4 sm:px-8 py-3.5 border-b backdrop-blur-md transition-colors ${
      isDark ? 'bg-slate-950/85 border-slate-800 text-slate-100' : 'bg-white/85 border-slate-200 text-slate-900'
    }`}>
      {/* Zone 1: Brand wordmark (single text element, whitespace-nowrap) */}
      <a
        href="#monitor"
        onClick={() => onSelectSection('monitor')}
        className="text-base sm:text-lg font-bold tracking-tight text-cyan-400 whitespace-nowrap shrink-0 flex items-center gap-2"
      >
        <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400 rotate-45 inline-block"></span>
        <span>RefreshRate Lab</span>
      </a>

      {/* Zone 2: 4-5 concise single-line nav links */}
      <nav className="hidden md:flex items-center gap-6 text-xs sm:text-sm font-medium text-slate-400">
        <button
          onClick={() => onSelectSection('monitor')}
          className={`hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 ${
            activeSection === 'monitor' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          实时监测
        </button>
        <button
          onClick={() => onSelectSection('motion')}
          className={`hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 ${
            activeSection === 'motion' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          动态验证
        </button>
        <button
          onClick={() => onSelectSection('compatibility')}
          className={`hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 ${
            activeSection === 'compatibility' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          兼容分析
        </button>
        <button
          onClick={onOpenHistory}
          className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
        >
          <span>历史对比</span>
          {historyCount > 0 && (
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-cyan-300">
              {historyCount}
            </span>
          )}
        </button>
        <button
          onClick={onOpenReport}
          className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
        >
          <Award className="w-3.5 h-3.5 text-cyan-400" />
          <span>性能报告</span>
        </button>
      </nav>

      {/* Zone 3: 1 primary action + theme toggle */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onToggleTheme}
          aria-label="切换浅色与深色模式"
          className={`p-2 rounded-lg border text-slate-400 hover:text-slate-100 transition-colors ${
            isDark ? 'border-slate-800 hover:bg-slate-900' : 'border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>

        <button
          onClick={onToggleTest}
          className={`px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-all shadow-sm ${
            isTesting
              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-500/20'
              : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-cyan-500/25'
          }`}
        >
          {isTesting ? (
            <>
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>停止测试</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>开始基准测试</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
