import React, { useMemo } from 'react';
import { FrameRecord } from '../types/benchmark';
import { Activity } from 'lucide-react';

interface FrameTimeHistogramProps {
  frames: FrameRecord[];
  nominalHz: number;
  isDark: boolean;
  frameTimeStdDevMs: number;
}

export const FrameTimeHistogram: React.FC<FrameTimeHistogramProps> = ({
  frames,
  nominalHz,
  isDark,
  frameTimeStdDevMs,
}) => {
  const targetFrameMs = 1000 / (nominalHz || 60);

  // Compute 25 histogram bins centered around targetFrameMs
  const { bins, maxBinCount, inTargetPercent } = useMemo(() => {
    if (frames.length === 0) {
      return { bins: [], maxBinCount: 1, inTargetPercent: 0 };
    }

    // Determine range around target: +/- 50%
    const minRange = Math.max(0.5, targetFrameMs * 0.5);
    const maxRange = targetFrameMs * 1.5;
    const numBins = 24;
    const binWidth = (maxRange - minRange) / numBins;

    const binCounts = new Array(numBins).fill(0);
    const binLabels = new Array(numBins).fill('');

    let inTargetToleranceCount = 0;
    const tolerance = targetFrameMs * 0.08; // +/- 8% tolerance

    for (let i = 0; i < numBins; i++) {
      const center = minRange + (i + 0.5) * binWidth;
      binLabels[i] = center.toFixed(1);
    }

    frames.forEach(f => {
      if (Math.abs(f.deltaMs - targetFrameMs) <= tolerance) {
        inTargetToleranceCount++;
      }

      if (f.deltaMs < minRange) {
        binCounts[0]++;
      } else if (f.deltaMs >= maxRange) {
        binCounts[numBins - 1]++;
      } else {
        const index = Math.min(numBins - 1, Math.floor((f.deltaMs - minRange) / binWidth));
        binCounts[index]++;
      }
    });

    const maxCount = Math.max(...binCounts, 1);
    const percent = Math.round((inTargetToleranceCount / frames.length) * 100);

    const resultBins = binCounts.map((count, i) => {
      const center = minRange + (i + 0.5) * binWidth;
      const isTargetBin = Math.abs(center - targetFrameMs) < binWidth * 0.9;
      return {
        label: binLabels[i],
        count,
        percent: Math.round((count / frames.length) * 100),
        isTargetBin,
        val: center,
      };
    });

    return { bins: resultBins, maxBinCount: maxCount, inTargetPercent: percent };
  }, [frames, targetFrameMs]);

  return (
    <div className={`p-4 rounded-xl border ${
      isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
    } transition-colors`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold tracking-tight">帧间隔离散度分布 (Frame Time Pacing)</h3>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">稳定命中率:</span>
          <span className="font-mono font-bold text-emerald-400 tabular-nums">
            {inTargetPercent}%
          </span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400">抖动:</span>
          <span className="font-mono text-cyan-400 tabular-nums">
            ±{frameTimeStdDevMs.toFixed(2)}ms
          </span>
        </div>
      </div>

      {/* Histogram bars container */}
      <div className={`h-28 flex items-end gap-1 p-2 rounded-lg border ${
        isDark ? 'bg-slate-950/80 border-slate-800/80' : 'bg-slate-50 border-slate-200'
      }`}>
        {bins.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
            暂无统计数据
          </div>
        ) : (
          bins.map((bin, i) => {
            const heightPercent = Math.max(3, (bin.count / maxBinCount) * 100);
            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center justify-end h-full group relative"
              >
                {/* Bar */}
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full rounded-t-xs transition-all duration-75 ${
                    bin.isTargetBin
                      ? 'bg-emerald-500 hover:bg-emerald-400 shadow-xs'
                      : bin.val > targetFrameMs * 1.2
                      ? 'bg-amber-500/80 hover:bg-amber-400'
                      : 'bg-slate-700 hover:bg-slate-500'
                  }`}
                />

                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none absolute bottom-full mb-1 z-20 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-slate-200 whitespace-nowrap shadow-md">
                  <div>{bin.val.toFixed(2)} ms</div>
                  <div className="text-emerald-400">{bin.count} 帧 ({bin.percent}%)</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Axis labels */}
      <div className="flex justify-between text-[11px] font-mono text-slate-500 mt-2 px-1">
        <span>{(targetFrameMs * 0.5).toFixed(1)} ms</span>
        <span className="text-emerald-400 font-semibold flex items-center gap-1">
          <span>▲ 目标标称 {targetFrameMs.toFixed(2)} ms</span>
        </span>
        <span>{(targetFrameMs * 1.5).toFixed(1)} ms</span>
      </div>
      <p className="text-xs text-slate-400 mt-2 leading-relaxed">
        柱体越集中在目标标称值（绿色柱）代表屏幕与合成器帧节奏（Frame Pacing）越均匀。若右侧出现长拖尾，表明存在微小卡顿或掉帧。
      </p>
    </div>
  );
};
