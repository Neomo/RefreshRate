import React, { useState } from 'react';
import { StutterEvent } from '../types/benchmark';
import { AlertTriangle, Download, Trash2, Filter, Search } from 'lucide-react';

interface StutterLogTableProps {
  events: StutterEvent[];
  isDark: boolean;
  onClear: () => void;
  onExportCsv: () => void;
  onExportJson: () => void;
}

export const StutterLogTable: React.FC<StutterLogTableProps> = ({
  events,
  isDark,
  onClear,
  onExportCsv,
  onExportJson,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'mild' | 'moderate' | 'severe'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEvents = events.filter(e => {
    if (filterSeverity !== 'all' && e.severity !== filterSeverity) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        e.possibleCause.toLowerCase().includes(term) ||
        e.frameIndex.toString().includes(term) ||
        e.deltaMs.toString().includes(term)
      );
    }
    return true;
  });

  return (
    <div className={`rounded-xl border ${
      isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
    } p-4 transition-colors`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold tracking-tight">
            帧波动与微卡顿记录
          </h3>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
            {events.length} 次事件
          </span>
        </div>

        {/* Action buttons & export */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Severity filter */}
          <div className="flex items-center gap-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterSeverity}
              onChange={e => setFilterSeverity(e.target.value as any)}
              className={`px-2 py-1 rounded text-xs border ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-800'
              }`}
            >
              <option value="all">全部等级</option>
              <option value="mild">轻微波动 (25-50%)</option>
              <option value="moderate">中度延迟 (50-100%)</option>
              <option value="severe">严重掉帧 (&gt;100%)</option>
            </select>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2 top-2 text-slate-400" />
            <input
              type="text"
              placeholder="搜索原因/帧号..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className={`pl-6 pr-2 py-1 text-xs rounded border w-28 sm:w-36 ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-slate-100 border-slate-300 text-slate-800 placeholder-slate-400'
              }`}
            />
          </div>

          {/* Export buttons */}
          <button
            onClick={onExportCsv}
            disabled={events.length === 0}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border transition-colors ${
              events.length === 0
                ? 'opacity-40 cursor-not-allowed border-transparent text-slate-500'
                : isDark
                ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                : 'border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>导出 CSV</span>
          </button>

          <button
            onClick={onExportJson}
            disabled={events.length === 0}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border transition-colors ${
              events.length === 0
                ? 'opacity-40 cursor-not-allowed border-transparent text-slate-500'
                : isDark
                ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                : 'border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span>JSON</span>
          </button>

          {/* Clear button */}
          {events.length > 0 && (
            <button
              onClick={onClear}
              title="清空记录"
              className="p-1 rounded text-slate-400 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Table list */}
      <div className={`overflow-x-auto rounded-lg border max-h-56 ${
        isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
      }`}>
        <table className="w-full text-left text-xs">
          <thead className={`sticky top-0 z-10 font-mono text-[11px] ${
            isDark ? 'bg-slate-900 text-slate-400 border-b border-slate-800' : 'bg-slate-100 text-slate-600 border-b border-slate-200'
          }`}>
            <tr>
              <th className="py-2 px-3">时间偏移</th>
              <th className="py-2 px-3">帧序号</th>
              <th className="py-2 px-3">实测耗时</th>
              <th className="py-2 px-3">理论目标</th>
              <th className="py-2 px-3">偏差幅度</th>
              <th className="py-2 px-3">波动等级</th>
              <th className="py-2 px-3">原因诊断</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40 font-mono">
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                  {events.length === 0 ? '暂无异常波动记录，帧间隔保持高度平稳。' : '未找到匹配的筛选记录。'}
                </td>
              </tr>
            ) : (
              filteredEvents.slice(0, 100).map(e => (
                <tr
                  key={e.id}
                  className={`transition-colors ${
                    isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-200/50'
                  }`}
                >
                  <td className="py-1.5 px-3 text-slate-400">
                    +{(e.timeOffsetMs / 1000).toFixed(2)}s
                  </td>
                  <td className="py-1.5 px-3 text-slate-300">#{e.frameIndex}</td>
                  <td className="py-1.5 px-3 font-semibold text-amber-400">
                    {e.deltaMs.toFixed(2)} ms
                  </td>
                  <td className="py-1.5 px-3 text-slate-400">{e.expectedMs.toFixed(2)} ms</td>
                  <td className="py-1.5 px-3">
                    <span className={e.deviationPercent >= 100 ? 'text-red-400 font-bold' : 'text-amber-400'}>
                      +{e.deviationPercent}%
                    </span>
                  </td>
                  <td className="py-1.5 px-3">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-sans font-medium ${
                        e.severity === 'severe'
                          ? 'bg-red-500/20 text-red-400'
                          : e.severity === 'moderate'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-yellow-500/10 text-yellow-300'
                      }`}
                    >
                      {e.severity === 'severe' ? '严重掉帧' : e.severity === 'moderate' ? '中度延迟' : '轻微抖动'}
                    </span>
                  </td>
                  <td className="py-1.5 px-3 text-slate-400 font-sans truncate max-w-xs" title={e.possibleCause}>
                    {e.possibleCause}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1">
        <span>实时监测滑动窗口采样，最多保留近期 300 条异常事件</span>
        <span>共匹配 {filteredEvents.length} 条</span>
      </div>
    </div>
  );
};
