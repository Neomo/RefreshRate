import React, { useState } from 'react';
import { BenchmarkHistoryItem } from '../types/benchmark';
import { X, ArrowRight, Trash2, GitCompare, PlusCircle, Check } from 'lucide-react';

interface HistoryComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: BenchmarkHistoryItem[];
  isDark: boolean;
  onDeleteHistoryItem: (id: string) => void;
  onClearAll: () => void;
}

export const HistoryComparisonModal: React.FC<HistoryComparisonModalProps> = ({
  isOpen,
  onClose,
  history,
  isDark,
  onDeleteHistoryItem,
  onClearAll,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      if (selectedIds.length < 3) {
        setSelectedIds([...selectedIds, id]);
      }
    }
  };

  const selectedItems = history.filter(h => selectedIds.includes(h.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className={`relative w-full max-w-4xl rounded-2xl border shadow-2xl overflow-hidden my-auto ${
        isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">测试历史记录与多场景对比分析</h2>
              <div className="text-xs text-slate-400">
                支持勾选 2~3 组测试记录进行横向参数对比 (如: 外接屏/内置屏、插电/省电模式)
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Active Comparison View (if 2+ selected) */}
          {selectedItems.length >= 2 && (
            <div className={`p-4 rounded-xl border ${
              isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <GitCompare className="w-3.5 h-3.5" />
                横向对照分析矩阵 ({selectedItems.length} 组对比)
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className={`font-mono text-[11px] ${
                    isDark ? 'bg-slate-900 text-slate-400 border-b border-slate-800' : 'bg-slate-200 text-slate-600 border-b border-slate-300'
                  }`}>
                    <tr>
                      <th className="py-2 px-3">对比指标</th>
                      {selectedItems.map((item, idx) => (
                        <th key={item.id} className="py-2 px-3 font-semibold text-slate-200">
                          样本 {idx + 1}: {item.label || item.formattedDate}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-[11px] font-mono">
                    <tr>
                      <td className="py-2 px-3 text-slate-400 font-sans">标称刷新率</td>
                      {selectedItems.map(item => (
                        <td key={item.id} className="py-2 px-3 font-bold text-cyan-400">
                          {item.stats.detectedHz} Hz
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-400 font-sans">实测均值 FPS</td>
                      {selectedItems.map(item => (
                        <td key={item.id} className="py-2 px-3 font-bold text-emerald-400">
                          {item.stats.avgFps.toFixed(1)} FPS
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-400 font-sans">平均帧时间</td>
                      {selectedItems.map(item => (
                        <td key={item.id} className="py-2 px-3 text-slate-200">
                          {item.stats.frameTimeAvgMs.toFixed(2)} ms
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-400 font-sans">帧抖动 Jitter (StdDev)</td>
                      {selectedItems.map(item => (
                        <td key={item.id} className="py-2 px-3 text-cyan-400">
                          ±{item.stats.frameTimeStdDevMs.toFixed(2)} ms
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-400 font-sans">1% Low 最低帧</td>
                      {selectedItems.map(item => (
                        <td key={item.id} className="py-2 px-3 text-amber-400">
                          {item.stats.fps1PercentLow.toFixed(1)} FPS
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-400 font-sans">丢帧/微卡顿比例</td>
                      {selectedItems.map(item => (
                        <td key={item.id} className="py-2 px-3 text-slate-300">
                          {item.stats.stutterRate.toFixed(1)}% ({item.stats.droppedFrames} 帧)
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-400 font-sans">评定等级</td>
                      {selectedItems.map(item => (
                        <td key={item.id} className="py-2 px-3 font-sans font-bold">
                          {item.stats.grade} ({item.stats.gradeTitle})
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* History List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                所有保存的测试记录 ({history.length})
              </h3>
              {history.length > 0 && (
                <button
                  onClick={onClearAll}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>清空历史</span>
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className={`p-8 text-center rounded-xl border ${
                isDark ? 'bg-slate-950/40 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                暂无保存的测试记录。在测试完成后点击「保存到本地历史对比库」，即可在此留存不同环境下的数据记录。
              </div>
            ) : (
              <div className="space-y-2">
                {history.map(item => {
                  const isChecked = selectedIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleSelect(item.id)}
                      className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 cursor-pointer transition-all ${
                        isChecked
                          ? isDark ? 'bg-cyan-950/20 border-cyan-500/50' : 'bg-cyan-50 border-cyan-300'
                          : isDark ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Checkbox */}
                        <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                          isChecked
                            ? 'bg-cyan-500 border-cyan-500 text-slate-950'
                            : isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-300 bg-white'
                        }`}>
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-slate-200">{item.label}</span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              ({item.testDurationSec}s 测试)
                            </span>
                            <span className="text-[11px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-medium">
                              等级 {item.stats.grade}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {item.formattedDate} · {item.browserInfo.browserName} ({item.browserInfo.screenResolution})
                          </div>
                        </div>
                      </div>

                      {/* Right stats and delete */}
                      <div className="flex items-center gap-4 text-xs font-mono">
                        <div>
                          <span className="text-slate-400 text-[11px]">标称:</span>{' '}
                          <span className="text-cyan-400 font-bold">{item.stats.detectedHz}Hz</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[11px]">实测:</span>{' '}
                          <span className="text-emerald-400 font-bold">{item.stats.avgFps.toFixed(1)} FPS</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[11px]">抖动:</span>{' '}
                          <span className="text-slate-300">±{item.stats.frameTimeStdDevMs.toFixed(2)}ms</span>
                        </div>

                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onDeleteHistoryItem(item.id);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-red-400 transition-colors"
                          title="删除此项"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
