import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FrameRecord } from '../types/benchmark';
import { ZoomIn, ZoomOut, Eye, Layers } from 'lucide-react';

interface OscilloscopeCanvasProps {
  frames: FrameRecord[];
  nominalHz: number;
  isDark: boolean;
  isPaused: boolean;
  timeWindowSec: number;
  onTimeWindowChange: (sec: number) => void;
}

export const OscilloscopeCanvas: React.FC<OscilloscopeCanvasProps> = ({
  frames,
  nominalHz,
  isDark,
  isPaused,
  timeWindowSec,
  onTimeWindowChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [activeTrace, setActiveTrace] = useState<'both' | 'fps' | 'delta'>('both');
  const [hoverData, setHoverData] = useState<{
    x: number;
    y: number;
    timeOffsetSec: number;
    fps: number;
    deltaMs: number;
    isStutter: boolean;
  } | null>(null);

  // Redraw canvas on frame updates or window resize
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    // Color definitions
    const bgGrid = isDark ? 'rgba(51, 65, 85, 0.25)' : 'rgba(203, 213, 225, 0.5)';
    const textMuted = isDark ? '#94a3b8' : '#64748b';
    const fpsLineColor = '#06b6d4'; // Cyan
    const deltaLineColor = '#f59e0b'; // Amber
    const stutterColor = '#ef4444'; // Red

    const padLeft = 46;
    const padRight = 46;
    const padTop = 24;
    const padBottom = 26;
    const chartWidth = Math.max(10, width - padLeft - padRight);
    const chartHeight = Math.max(10, height - padTop - padBottom);

    // Calculate time bounds: show frames within the last `timeWindowSec`
    const now = frames.length > 0 ? frames[frames.length - 1].timestamp : 0;
    const startTime = now - timeWindowSec * 1000;
    const visibleFrames = frames.filter(f => f.timestamp >= startTime);

    // FPS Y-Axis scale: dynamic based on nominal Hz
    const maxTargetFps = Math.max(nominalHz * 1.25, 75);
    const minTargetFps = 0;

    // Delta ms Y-Axis scale: nominal frame time (e.g. 16.67ms for 60Hz) to 40ms
    const targetDeltaMs = 1000 / nominalHz;
    const maxTargetDeltaMs = Math.max(targetDeltaMs * 2.5, 35);

    // 1. Draw Background Grid
    ctx.lineWidth = 1;
    ctx.strokeStyle = bgGrid;

    // Horizontal grid lines (4 divisions)
    const yDivisions = 4;
    for (let i = 0; i <= yDivisions; i++) {
      const y = padTop + (chartHeight * i) / yDivisions;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(width - padRight, y);
      ctx.stroke();

      // Labels on Left (FPS)
      const fpsVal = Math.round(maxTargetFps - (maxTargetFps - minTargetFps) * (i / yDivisions));
      ctx.fillStyle = textMuted;
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${fpsVal}`, padLeft - 6, y);

      // Labels on Right (Frame Time ms)
      const deltaVal = (maxTargetDeltaMs * (1 - i / yDivisions)).toFixed(1);
      ctx.textAlign = 'left';
      ctx.fillText(`${deltaVal}ms`, width - padRight + 6, y);
    }

    // Vertical time grid lines
    const timeDivisions = 5;
    for (let i = 0; i <= timeDivisions; i++) {
      const x = padLeft + (chartWidth * i) / timeDivisions;
      ctx.beginPath();
      ctx.moveTo(x, padTop);
      ctx.lineTo(x, height - padBottom);
      ctx.stroke();

      // Time label at bottom
      const timeVal = ((timeWindowSec * (timeDivisions - i)) / timeDivisions).toFixed(1);
      ctx.fillStyle = textMuted;
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(`-${timeVal}s`, x, height - padBottom + 6);
    }

    // 2. Draw Nominal Refresh Rate Guide Line
    const nominalY = padTop + chartHeight * (1 - (nominalHz - minTargetFps) / (maxTargetFps - minTargetFps));
    if (nominalY >= padTop && nominalY <= height - padBottom) {
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = isDark ? 'rgba(6, 182, 212, 0.45)' : 'rgba(6, 182, 212, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(padLeft, nominalY);
      ctx.lineTo(width - padRight, nominalY);
      ctx.stroke();

      // Guide label
      ctx.fillStyle = fpsLineColor;
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`基准 ${nominalHz} Hz`, padLeft + 8, nominalY - 6);
      ctx.restore();
    }

    // Target frame time guide line (ms)
    const targetDeltaY = padTop + chartHeight * (1 - targetDeltaMs / maxTargetDeltaMs);
    if (targetDeltaY >= padTop && targetDeltaY <= height - padBottom && activeTrace !== 'fps') {
      ctx.save();
      ctx.setLineDash([2, 4]);
      ctx.strokeStyle = isDark ? 'rgba(245, 158, 11, 0.35)' : 'rgba(217, 119, 6, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padLeft, targetDeltaY);
      ctx.lineTo(width - padRight, targetDeltaY);
      ctx.stroke();

      ctx.fillStyle = deltaLineColor;
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`目标 ${targetDeltaMs.toFixed(2)}ms`, width - padRight - 8, targetDeltaY - 6);
      ctx.restore();
    }

    if (visibleFrames.length < 2) {
      // Empty state hint
      ctx.fillStyle = textMuted;
      ctx.font = '12px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('正在采集帧间隔序列...', width / 2, height / 2);
      ctx.restore();
      return;
    }

    // Coordinate mapping helper
    const getX = (t: number) => {
      const progress = (t - startTime) / (timeWindowSec * 1000);
      return padLeft + progress * chartWidth;
    };

    const getYFps = (f: number) => {
      const clamped = Math.max(minTargetFps, Math.min(maxTargetFps, f));
      return padTop + chartHeight * (1 - (clamped - minTargetFps) / (maxTargetFps - minTargetFps));
    };

    const getYDelta = (d: number) => {
      const clamped = Math.max(0, Math.min(maxTargetDeltaMs, d));
      return padTop + chartHeight * (1 - clamped / maxTargetDeltaMs);
    };

    // 3. Trace 1: FPS Curve (Cyan)
    if (activeTrace === 'both' || activeTrace === 'fps') {
      // Shaded area under curve
      const gradient = ctx.createLinearGradient(0, padTop, 0, height - padBottom);
      gradient.addColorStop(0, isDark ? 'rgba(6, 182, 212, 0.18)' : 'rgba(6, 182, 212, 0.12)');
      gradient.addColorStop(1, 'rgba(6, 182, 212, 0.0)');

      ctx.beginPath();
      ctx.moveTo(getX(visibleFrames[0].timestamp), height - padBottom);
      for (let i = 0; i < visibleFrames.length; i++) {
        const f = visibleFrames[i];
        ctx.lineTo(getX(f.timestamp), getYFps(f.fps));
      }
      ctx.lineTo(getX(visibleFrames[visibleFrames.length - 1].timestamp), height - padBottom);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Stroke Line
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = fpsLineColor;
      for (let i = 0; i < visibleFrames.length; i++) {
        const f = visibleFrames[i];
        const x = getX(f.timestamp);
        const y = getYFps(f.fps);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // 4. Trace 2: Delta Frame Time ms Curve (Amber)
    if (activeTrace === 'both' || activeTrace === 'delta') {
      ctx.beginPath();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = deltaLineColor;
      for (let i = 0; i < visibleFrames.length; i++) {
        const f = visibleFrames[i];
        const x = getX(f.timestamp);
        const y = getYDelta(f.deltaMs);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // 5. Draw Stutter / Drop Markers (Vertical pins)
    for (let i = 0; i < visibleFrames.length; i++) {
      const f = visibleFrames[i];
      if (f.isStutter) {
        const x = getX(f.timestamp);
        const y = activeTrace === 'fps' ? getYFps(f.fps) : getYDelta(f.deltaMs);

        ctx.strokeStyle = f.isSevereStutter ? stutterColor : '#fbbf24';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, padTop);
        ctx.lineTo(x, height - padBottom);
        ctx.stroke();

        // Pin dot at point
        ctx.beginPath();
        ctx.arc(x, y, f.isSevereStutter ? 3.5 : 2.5, 0, Math.PI * 2);
        ctx.fillStyle = f.isSevereStutter ? stutterColor : '#fbbf24';
        ctx.fill();
      }
    }

    // 6. Draw Hover Crosshair and Point
    if (hoverData && hoverData.x >= padLeft && hoverData.x <= width - padRight) {
      ctx.save();
      ctx.setLineDash([2, 2]);
      ctx.strokeStyle = isDark ? '#cbd5e1' : '#475569';
      ctx.lineWidth = 1;

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(hoverData.x, padTop);
      ctx.lineTo(hoverData.x, height - padBottom);
      ctx.stroke();

      // Point at curve
      const hoverY = activeTrace === 'delta' ? getYDelta(hoverData.deltaMs) : getYFps(hoverData.fps);
      ctx.beginPath();
      ctx.arc(hoverData.x, hoverY, 4, 0, Math.PI * 2);
      ctx.fillStyle = activeTrace === 'delta' ? deltaLineColor : fpsLineColor;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }, [frames, nominalHz, isDark, activeTrace, timeWindowSec, hoverData]);

  // Resize canvas when container size changes
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      draw();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Handle canvas mouse move for interactive scrubbing
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || frames.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const padLeft = 46;
    const padRight = 46;
    const chartWidth = rect.width - padLeft - padRight;

    if (mouseX < padLeft || mouseX > rect.width - padRight) {
      setHoverData(null);
      return;
    }

    const now = frames[frames.length - 1].timestamp;
    const startTime = now - timeWindowSec * 1000;
    const progress = (mouseX - padLeft) / chartWidth;
    const targetTimestamp = startTime + progress * (timeWindowSec * 1000);

    // Find nearest frame
    let closest = frames[0];
    let minDiff = Infinity;
    for (const f of frames) {
      const diff = Math.abs(f.timestamp - targetTimestamp);
      if (diff < minDiff) {
        minDiff = diff;
        closest = f;
      }
    }

    setHoverData({
      x: mouseX,
      y: mouseY,
      timeOffsetSec: Math.max(0, (now - closest.timestamp) / 1000),
      fps: closest.fps,
      deltaMs: closest.deltaMs,
      isStutter: closest.isStutter,
    });
  };

  const handleMouseLeave = () => {
    setHoverData(null);
  };

  return (
    <div className={`relative flex flex-col w-full rounded-xl border ${
      isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
    } p-4 transition-colors`}>
      {/* Header controls bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold tracking-tight">实时帧率与间隔示波器</h3>
          {isPaused && (
            <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 font-medium">
              已暂停捕获
            </span>
          )}
        </div>

        {/* Trace filter buttons & Zoom controls */}
        <div className="flex items-center gap-2 text-xs">
          {/* Trace view selector */}
          <div className={`flex items-center p-0.5 rounded-lg border ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => setActiveTrace('both')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                activeTrace === 'both'
                  ? isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              双轨监测
            </button>
            <button
              onClick={() => setActiveTrace('fps')}
              className={`px-2.5 py-1 rounded font-medium flex items-center gap-1 transition-colors ${
                activeTrace === 'fps'
                  ? 'bg-cyan-500/20 text-cyan-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-2 h-0.5 bg-cyan-400 rounded-full inline-block"></span>
              仅FPS
            </button>
            <button
              onClick={() => setActiveTrace('delta')}
              className={`px-2.5 py-1 rounded font-medium flex items-center gap-1 transition-colors ${
                activeTrace === 'delta'
                  ? 'bg-amber-500/20 text-amber-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-2 h-0.5 bg-amber-400 rounded-full inline-block"></span>
              仅帧时间(ms)
            </button>
          </div>

          {/* Time window selector */}
          <div className="flex items-center gap-1 ml-1">
            {[3, 6, 12, 30].map(sec => (
              <button
                key={sec}
                onClick={() => onTimeWindowChange(sec)}
                className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
                  timeWindowSec === sec
                    ? isDark ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-cyan-50 text-cyan-700 border border-cyan-300'
                    : isDark ? 'bg-slate-800 text-slate-400 hover:text-slate-200' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main interactive canvas viewport */}
      <div
        ref={containerRef}
        className={`relative w-full h-64 sm:h-72 rounded-lg overflow-hidden border ${
          isDark ? 'bg-slate-950/80 border-slate-800/80' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full h-full cursor-crosshair block"
        />

        {/* Hover inspection tooltip */}
        {hoverData && (
          <div
            className={`absolute top-3 left-14 pointer-events-none px-3 py-1.5 rounded-md text-xs font-mono shadow-lg border backdrop-blur-md ${
              isDark ? 'bg-slate-900/90 border-slate-700 text-slate-200' : 'bg-white/95 border-slate-300 text-slate-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-slate-400">-{hoverData.timeOffsetSec.toFixed(2)}s</span>
              <span className="text-cyan-400 font-bold">{hoverData.fps.toFixed(1)} FPS</span>
              <span className="text-amber-400">{hoverData.deltaMs.toFixed(2)} ms</span>
              {hoverData.isStutter && (
                <span className="text-red-400 font-semibold px-1 rounded bg-red-500/10">波动丢帧</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Telemetry legend and explanation */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 mt-3 pt-2 border-t border-slate-800/40">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-cyan-400 rounded-sm"></span>
            <span>瞬时帧率 (FPS)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-amber-400 rounded-sm"></span>
            <span>帧间隔时间 (ms)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span>微卡顿 / 丢帧标记</span>
          </div>
        </div>
        <div className="hidden sm:block text-slate-500 font-mono">
          基准理论周期: {(1000 / nominalHz).toFixed(2)} ms/帧
        </div>
      </div>
    </div>
  );
};
