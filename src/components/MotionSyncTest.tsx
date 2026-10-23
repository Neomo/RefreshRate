import React, { useRef, useEffect, useState } from 'react';
import { Gauge, Sliders, Zap } from 'lucide-react';

interface MotionSyncTestProps {
  nominalHz: number;
  currentFps: number;
  isDark: boolean;
  stressLevel: number; // 0 (none), 1 (light), 2 (medium), 3 (heavy)
  onStressChange: (level: number) => void;
}

export const MotionSyncTest: React.FC<MotionSyncTestProps> = ({
  nominalHz,
  currentFps,
  isDark,
  stressLevel,
  onStressChange,
}) => {
  const [speedPxSec, setSpeedPxSec] = useState<number>(480);
  const [trackWidth, setTrackWidth] = useState<number>(800);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Animation state refs
  const posFullRef = useRef<number>(0);
  const pos60Ref = useRef<number>(0);
  const pos30Ref = useRef<number>(0);

  const lastTimeFullRef = useRef<number>(performance.now());
  const lastTime60Ref = useRef<number>(performance.now());
  const lastTime30Ref = useRef<number>(performance.now());

  // Canvas ref for direct zero-overhead animation
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setTrackWidth(containerRef.current.clientWidth);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let animId: number;

    const render = (time: number) => {
      // 1. Synthetic stress workload simulation (if enabled)
      if (stressLevel > 0) {
        const startBusy = performance.now();
        // stressLevel 1: ~2ms, stressLevel 2: ~5ms, stressLevel 3: ~12ms
        const busyBudgetMs = stressLevel === 1 ? 2.5 : stressLevel === 2 ? 6.0 : 13.0;
        let dummy = 0;
        while (performance.now() - startBusy < busyBudgetMs) {
          dummy += Math.sqrt(Math.random() * 1000);
        }
        if (dummy === -1) console.log(dummy);
      }

      const canvas = canvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(render);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animId = requestAnimationFrame(render);
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);

      // Track 1: Full native display Hz
      const dtFull = (time - lastTimeFullRef.current) / 1000;
      lastTimeFullRef.current = time;
      posFullRef.current = (posFullRef.current + speedPxSec * dtFull) % (width + 80);

      // Track 2: 60 FPS capped (tick at 16.67ms intervals)
      const interval60 = 1000 / 60;
      if (time - lastTime60Ref.current >= interval60) {
        const dt60 = (time - lastTime60Ref.current) / 1000;
        pos60Ref.current = (pos60Ref.current + speedPxSec * dt60) % (width + 80);
        lastTime60Ref.current = time;
      }

      // Track 3: 30 FPS capped (tick at 33.33ms intervals)
      const interval30 = 1000 / 30;
      if (time - lastTime30Ref.current >= interval30) {
        const dt30 = (time - lastTime30Ref.current) / 1000;
        pos30Ref.current = (pos30Ref.current + speedPxSec * dt30) % (width + 80);
        lastTime30Ref.current = time;
      }

      // Draw background lanes
      const laneHeight = height / 3;
      const laneBg = isDark ? 'rgba(30, 41, 59, 0.4)' : 'rgba(241, 245, 249, 0.8)';
      const laneDivider = isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 1)';
      const textColor = isDark ? '#f8fafc' : '#0f172a';
      const labelMuted = isDark ? '#94a3b8' : '#64748b';

      const tracks = [
        {
          label: `原生全速 (${nominalHz} Hz / ${currentFps.toFixed(0)} FPS)`,
          badge: '原生流程度',
          badgeColor: '#06b6d4',
          pos: posFullRef.current - 40,
          color: '#06b6d4',
        },
        {
          label: '标准参考 (60 FPS)',
          badge: '基准参照',
          badgeColor: '#10b981',
          pos: pos60Ref.current - 40,
          color: '#10b981',
        },
        {
          label: '低刷对比 (30 FPS)',
          badge: '对比档位',
          badgeColor: '#f59e0b',
          pos: pos30Ref.current - 40,
          color: '#f59e0b',
        },
      ];

      tracks.forEach((tr, i) => {
        const yTop = i * laneHeight;

        // Lane background
        ctx.fillStyle = i % 2 === 0 ? laneBg : 'transparent';
        ctx.fillRect(0, yTop, width, laneHeight);

        // Divider
        if (i > 0) {
          ctx.strokeStyle = laneDivider;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, yTop);
          ctx.lineTo(width, yTop);
          ctx.stroke();
        }

        // Lane track text
        ctx.fillStyle = textColor;
        ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(tr.label, 14, yTop + 10);

        ctx.fillStyle = labelMuted;
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillText(`位移速度: ${speedPxSec} px/s`, 14, yTop + 28);

        // Draw moving glider element
        const objX = tr.pos;
        const objY = yTop + laneHeight / 2 + 6;
        const objW = 60;
        const objH = 26;

        ctx.save();
        ctx.translate(objX, objY);

        // Moving object body (Sleek aerodynamic glider)
        ctx.fillStyle = tr.color;
        ctx.shadowColor = tr.color;
        ctx.shadowBlur = isDark ? 8 : 2;

        ctx.beginPath();
        ctx.roundRect(-objW / 2, -objH / 2, objW, objH, 6);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Internal tick markings (to test motion judder and eyes following movement)
        ctx.fillStyle = '#ffffff';
        for (let t = -16; t <= 16; t += 8) {
          ctx.fillRect(t - 1, -objH / 2 + 4, 2, objH - 8);
        }

        ctx.restore();
      });

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [nominalHz, currentFps, isDark, speedPxSec, stressLevel]);

  // Adjust canvas pixel dimensions on resize
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = 240 * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `240px`;
  }, [trackWidth]);

  return (
    <div className={`p-4 rounded-xl border ${
      isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
    } transition-colors`}>
      {/* Title & Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold tracking-tight">运动同步与动态清晰度视觉验证</h3>
        </div>

        {/* Speed & Stress Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Speed selector */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400 text-[11px]">滑行速度:</span>
            {[240, 480, 960].map(s => (
              <button
                key={s}
                onClick={() => setSpeedPxSec(s)}
                className={`px-2 py-0.5 rounded font-mono text-xs transition-colors ${
                  speedPxSec === s
                    ? isDark ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-cyan-50 text-cyan-700 border border-cyan-300'
                    : isDark ? 'bg-slate-800 text-slate-400 hover:text-slate-200' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                {s}px/s
              </button>
            ))}
          </div>

          {/* Stress workload test */}
          <div className="flex items-center gap-1 pl-2 border-l border-slate-700/60">
            <Zap className={`w-3.5 h-3.5 ${stressLevel > 0 ? 'text-amber-400' : 'text-slate-400'}`} />
            <span className="text-slate-400 text-[11px]">压力负载:</span>
            {[
              { level: 0, label: '无负载' },
              { level: 1, label: '轻度' },
              { level: 2, label: '中度' },
              { level: 3, label: '重度' },
            ].map(item => (
              <button
                key={item.level}
                onClick={() => onStressChange(item.level)}
                className={`px-2 py-0.5 rounded text-xs transition-colors ${
                  stressLevel === item.level
                    ? item.level === 0
                      ? isDark ? 'bg-slate-700 text-white' : 'bg-slate-300 text-slate-900'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/40 font-semibold'
                    : isDark ? 'bg-slate-800 text-slate-400 hover:text-slate-200' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Synchronized motion canvas */}
      <div
        ref={containerRef}
        className={`w-full rounded-lg overflow-hidden border ${
          isDark ? 'bg-slate-950/80 border-slate-800/80' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <canvas ref={canvasRef} className="block w-full" />
      </div>

      <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 mt-2.5">
        <p className="leading-relaxed">
          视觉测试原理：跟随移动滑块平移视线。在 120Hz/144Hz/240Hz 原生轨道上，内部白色栅格应保持清晰可辨；在 30FPS 轨道上，眼球追踪时会出现明显的断续拖影（Judder）。
        </p>
        {stressLevel > 0 && (
          <span className="text-amber-400 font-medium">
            ▲ 已开启模拟合成器计算负载，可观察是否引起微小丢帧。
          </span>
        )}
      </div>
    </div>
  );
};
