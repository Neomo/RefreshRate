/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FrameRecord,
  BenchmarkStats,
  StutterEvent,
  BrowserSystemInfo,
  BenchmarkHistoryItem,
  TestMode,
} from './types/benchmark';
import { detectBrowserAndSystem } from './utils/browserDetect';
import {
  calculateBenchmarkStats,
  analyzeStutter,
  matchNominalRefreshRate,
} from './utils/refreshRateEngine';
import { Navbar } from './components/Navbar';
import { OscilloscopeCanvas } from './components/OscilloscopeCanvas';
import { FrameTimeHistogram } from './components/FrameTimeHistogram';
import { MotionSyncTest } from './components/MotionSyncTest';
import { StutterLogTable } from './components/StutterLogTable';
import { CompatibilityAnalysis } from './components/CompatibilityAnalysis';
import { PerformanceReportModal } from './components/PerformanceReportModal';
import { HistoryComparisonModal } from './components/HistoryComparisonModal';
import {
  Play,
  Square,
  RotateCcw,
  Clock,
  Activity,
  Layers,
  Award,
  Download,
  AlertTriangle,
  Zap,
  Sliders,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export default function App() {
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(true);

  // System & Browser detection
  const [browserInfo, setBrowserInfo] = useState<BrowserSystemInfo>(() => detectBrowserAndSystem());

  // Test execution state
  const [testMode, setTestMode] = useState<TestMode>('timed');
  const [targetDurationSec, setTargetDurationSec] = useState<number>(15);
  const [customDurationInput, setCustomDurationInput] = useState<string>('15');
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [stressLevel, setStressLevel] = useState<number>(0);
  const [timeWindowSec, setTimeWindowSec] = useState<number>(6);

  // Modals state
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<string>('monitor');

  // History stored in LocalStorage
  const [history, setHistory] = useState<BenchmarkHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('refreshrate_benchmark_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Real-time telemetry buffer (Ref to prevent React re-render lagging Raf loop)
  const framesRef = useRef<FrameRecord[]>([]);
  const deltasRef = useRef<number[]>([]);
  const stuttersRef = useRef<StutterEvent[]>([]);
  const frameCountRef = useRef<number>(0);
  const lastTimestampRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);

  // UI state synchronized at ~10Hz
  const [displayFrames, setDisplayFrames] = useState<FrameRecord[]>([]);
  const [displayStutters, setDisplayStutters] = useState<StutterEvent[]>([]);
  const [stats, setStats] = useState<BenchmarkStats>(() =>
    calculateBenchmarkStats([], 0)
  );

  // Save history helper
  const handleSaveToHistory = useCallback(() => {
    const newItem: BenchmarkHistoryItem = {
      id: `run_${Date.now()}`,
      timestamp: Date.now(),
      formattedDate: new Date().toLocaleTimeString(),
      testDurationSec: targetDurationSec,
      stats: { ...stats },
      browserInfo: { ...browserInfo },
      label: `${stats.detectedHz}Hz · ${browserInfo.browserName}`,
    };

    const updated = [newItem, ...history].slice(0, 20);
    setHistory(updated);
    try {
      localStorage.setItem('refreshrate_benchmark_history', JSON.stringify(updated));
    } catch {
      // ignore
    }
  }, [stats, browserInfo, targetDurationSec, history]);

  // Handle clearing history
  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('refreshrate_benchmark_history');
    } catch {
      // ignore
    }
  };

  const handleDeleteHistoryItem = (id: string) => {
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    try {
      localStorage.setItem('refreshrate_benchmark_history', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Stop benchmark
  const stopBenchmark = useCallback(() => {
    setIsTesting(false);
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    // Final statistics calculation
    const finalDuration = performance.now() - startTimeRef.current;
    const finalStats = calculateBenchmarkStats(deltasRef.current, finalDuration);
    setStats(finalStats);
    setDisplayFrames([...framesRef.current]);
    setDisplayStutters([...stuttersRef.current]);
  }, []);

  // Main high-precision animation loop
  const stepRaf = useCallback(
    (now: number) => {
      if (lastTimestampRef.current === 0) {
        lastTimestampRef.current = now;
        startTimeRef.current = now;
        rafIdRef.current = requestAnimationFrame(stepRaf);
        return;
      }

      const delta = now - lastTimestampRef.current;
      lastTimestampRef.current = now;

      // Filter out extreme anomalous pauses (e.g., user switched tabs for seconds)
      if (delta > 0 && delta < 500) {
        frameCountRef.current++;
        deltasRef.current.push(delta);

        const currentFps = 1000 / delta;
        const currentNominalHz =
          stats.detectedHz || matchNominalRefreshRate(currentFps).nominalHz;
        const expectedFrameMs = 1000 / currentNominalHz;

        const isStutter = delta > expectedFrameMs * 1.25;
        const isSevereStutter = delta > expectedFrameMs * 2.0;

        const frameItem: FrameRecord = {
          index: frameCountRef.current,
          timestamp: now,
          deltaMs: delta,
          fps: currentFps,
          isStutter,
          isSevereStutter,
        };

        // Ring buffer for canvas oscilloscope (keep last 1800 frames ~ 15s at 120Hz)
        framesRef.current.push(frameItem);
        if (framesRef.current.length > 2000) {
          framesRef.current.shift();
        }

        // Anomaly stutter detection
        if (isStutter) {
          const stutterEvent = analyzeStutter(
            delta,
            expectedFrameMs,
            frameCountRef.current,
            now - startTimeRef.current
          );
          if (stutterEvent) {
            stuttersRef.current.unshift(stutterEvent);
            if (stuttersRef.current.length > 300) {
              stuttersRef.current.pop();
            }
          }
        }
      }

      const currentElapsed = now - startTimeRef.current;
      setElapsedMs(currentElapsed);

      // Check if timed benchmark duration reached
      if (testMode === 'timed' && currentElapsed >= targetDurationSec * 1000) {
        stopBenchmark();
        setIsReportOpen(true);
        return;
      }

      rafIdRef.current = requestAnimationFrame(stepRaf);
    },
    [testMode, targetDurationSec, stats.detectedHz, stopBenchmark]
  );

  // Start benchmark
  const startBenchmark = useCallback(() => {
    // Reset buffers
    framesRef.current = [];
    deltasRef.current = [];
    stuttersRef.current = [];
    frameCountRef.current = 0;
    lastTimestampRef.current = 0;
    startTimeRef.current = 0;

    setDisplayFrames([]);
    setDisplayStutters([]);
    setElapsedMs(0);
    setIsTesting(true);

    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = requestAnimationFrame(stepRaf);
  }, [stepRaf]);

  // Periodic React state synchronization (every 100ms) so telemetry doesn't choke the render pipeline
  useEffect(() => {
    if (!isTesting) return;

    const interval = setInterval(() => {
      const now = performance.now();
      const currentDuration = now - startTimeRef.current;
      const latestStats = calculateBenchmarkStats(
        deltasRef.current,
        currentDuration
      );

      setStats(latestStats);
      setDisplayFrames([...framesRef.current]);
      setDisplayStutters([...stuttersRef.current]);
    }, 100);

    return () => clearInterval(interval);
  }, [isTesting]);

  // Auto-start continuous mode on initial mount for immediate out-of-the-box telemetry
  useEffect(() => {
    startBenchmark();
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  // Export full raw frame logs to CSV
  const handleExportCsv = () => {
    const records = framesRef.current;
    if (records.length === 0) return;

    let csv = 'Frame_Index,Timestamp_ms,Frame_Time_Delta_ms,Instant_FPS,Is_Stutter\n';
    records.forEach(r => {
      csv += `${r.index},${r.timestamp.toFixed(2)},${r.deltaMs.toFixed(3)},${r.fps.toFixed(2)},${r.isStutter ? 1 : 0}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `refreshrate_log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export comprehensive JSON report
  const handleExportJson = () => {
    const reportData = {
      benchmarkTitle: 'RefreshRate Lab Performance Benchmark Report',
      timestamp: new Date().toISOString(),
      testMode,
      targetDurationSec,
      stats,
      browserAndHardware: browserInfo,
      stutterEventsCount: stuttersRef.current.length,
      stutterEvents: stuttersRef.current,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `refreshrate_report_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const targetFrameMs = 1000 / (stats.detectedHz || 60);

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100/70 text-slate-900'
      }`}
    >
      {/* 3-Zone Top Navigation Bar */}
      <Navbar
        isTesting={isTesting}
        onToggleTest={() => (isTesting ? stopBenchmark() : startBenchmark())}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        onOpenReport={() => setIsReportOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        activeSection={activeSection}
        onSelectSection={sec => {
          setActiveSection(sec);
          const el = document.getElementById(sec);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        historyCount={history.length}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Control Strip & Real-time Progress Bar */}
        <section
          id="monitor"
          className={`p-4 rounded-xl border shadow-sm transition-colors ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Mode & Duration Preset Selector */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                测试模式:
              </span>

              {/* Mode switch */}
              <div
                className={`flex items-center p-0.5 rounded-lg border text-xs ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
                }`}
              >
                <button
                  onClick={() => setTestMode('timed')}
                  className={`px-3 py-1 rounded font-medium transition-colors ${
                    testMode === 'timed'
                      ? isDark
                        ? 'bg-slate-800 text-cyan-400 font-semibold'
                        : 'bg-white text-cyan-700 font-semibold shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  定量基准测试
                </button>
                <button
                  onClick={() => setTestMode('continuous')}
                  className={`px-3 py-1 rounded font-medium transition-colors ${
                    testMode === 'continuous'
                      ? isDark
                        ? 'bg-slate-800 text-cyan-400 font-semibold'
                        : 'bg-white text-cyan-700 font-semibold shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  持续实时监测
                </button>
              </div>

              {/* Duration presets (if timed mode) */}
              {testMode === 'timed' && (
                <div className="flex items-center gap-1.5 ml-1 text-xs">
                  {[5, 15, 30, 60].map(sec => (
                    <button
                      key={sec}
                      onClick={() => {
                        setTargetDurationSec(sec);
                        setCustomDurationInput(sec.toString());
                      }}
                      className={`px-2.5 py-1 rounded font-mono transition-colors ${
                        targetDurationSec === sec
                          ? isDark
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-bold'
                            : 'bg-cyan-50 text-cyan-700 border border-cyan-300 font-bold'
                          : isDark
                          ? 'bg-slate-800 text-slate-400 hover:text-slate-200'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {sec}秒
                    </button>
                  ))}

                  {/* Custom duration input */}
                  <div className="flex items-center gap-1 ml-1 text-xs text-slate-400">
                    <span>自定义:</span>
                    <input
                      type="number"
                      min="1"
                      max="300"
                      value={customDurationInput}
                      onChange={e => {
                        const val = e.target.value;
                        setCustomDurationInput(val);
                        const n = parseInt(val, 10);
                        if (!isNaN(n) && n > 0 && n <= 300) {
                          setTargetDurationSec(n);
                        }
                      }}
                      className={`w-14 px-1.5 py-0.5 rounded text-center font-mono text-xs border ${
                        isDark
                          ? 'bg-slate-950 border-slate-800 text-slate-200'
                          : 'bg-slate-50 border-slate-300 text-slate-800'
                      }`}
                    />
                    <span>秒</span>
                  </div>
                </div>
              )}
            </div>

            {/* Test Action Trigger & Reset */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => (isTesting ? stopBenchmark() : startBenchmark())}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                  isTesting
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                }`}
              >
                {isTesting ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>停止采集</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>重新开始测试</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  stopBenchmark();
                  framesRef.current = [];
                  deltasRef.current = [];
                  stuttersRef.current = [];
                  setDisplayFrames([]);
                  setDisplayStutters([]);
                  setStats(calculateBenchmarkStats([], 0));
                }}
                title="清空当前缓冲数据"
                className={`p-1.5 rounded-lg border text-slate-400 hover:text-slate-200 transition-colors ${
                  isDark ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-100'
                }`}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress bar in timed mode */}
          {testMode === 'timed' && isTesting && (
            <div className="mt-3 pt-3 border-t border-slate-800/40">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-400">基准测试进度:</span>
                <span className="font-mono text-cyan-400 font-bold">
                  {(elapsedMs / 1000).toFixed(1)}s / {targetDurationSec}s (
                  {Math.min(100, Math.round((elapsedMs / (targetDurationSec * 1000)) * 100))}%)
                </span>
              </div>
              <div
                className={`w-full h-1.5 rounded-full overflow-hidden ${
                  isDark ? 'bg-slate-950' : 'bg-slate-200'
                }`}
              >
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-100"
                  style={{
                    width: `${Math.min(100, (elapsedMs / (targetDurationSec * 1000)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </section>

        {/* Primary Dashboard KPI Telemetry Row */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* KPI 1: Detected Refresh Rate & Instant FPS */}
          <div
            className={`p-4 rounded-xl border shadow-xs transition-colors ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="text-slate-400 text-xs font-medium">标称屏幕刷新率</div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-cyan-400 tracking-tight mt-1">
              {stats.detectedHz}{' '}
              <span className="text-xs sm:text-sm font-normal text-slate-400">Hz</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
              <span>瞬时:</span>
              <span className="font-mono text-slate-200 font-semibold tabular-nums">
                {stats.currentFps.toFixed(1)} FPS
              </span>
            </div>
          </div>

          {/* KPI 2: Measured Average FPS */}
          <div
            className={`p-4 rounded-xl border shadow-xs transition-colors ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="text-slate-400 text-xs font-medium">实测平均帧率</div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400 tracking-tight mt-1">
              {stats.avgFps.toFixed(1)}{' '}
              <span className="text-xs sm:text-sm font-normal text-slate-400">FPS</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
              <span>中位数:</span>
              <span className="font-mono text-slate-200 font-semibold tabular-nums">
                {stats.medianFps.toFixed(1)} FPS
              </span>
            </div>
          </div>

          {/* KPI 3: Average Frame Time ms */}
          <div
            className={`p-4 rounded-xl border shadow-xs transition-colors ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="text-slate-400 text-xs font-medium">平均帧时间</div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-100 tracking-tight mt-1">
              {stats.frameTimeAvgMs.toFixed(2)}{' '}
              <span className="text-xs sm:text-sm font-normal text-slate-400">ms</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              基准: <span className="font-mono">{targetFrameMs.toFixed(2)}ms</span>
            </div>
          </div>

          {/* KPI 4: Frame Jitter StdDev */}
          <div
            className={`p-4 rounded-xl border shadow-xs transition-colors ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="text-slate-400 text-xs font-medium">帧抖动 (Jitter)</div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-cyan-400 tracking-tight mt-1">
              ±{stats.frameTimeStdDevMs.toFixed(2)}{' '}
              <span className="text-xs sm:text-sm font-normal text-slate-400">ms</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              置信度: <span className="font-mono text-emerald-400">{stats.confidence}%</span>
            </div>
          </div>

          {/* KPI 5: 1% Low FPS */}
          <div
            className={`p-4 rounded-xl border shadow-xs transition-colors ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="text-slate-400 text-xs font-medium">1% Low 帧率</div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-400 tracking-tight mt-1">
              {stats.fps1PercentLow.toFixed(1)}{' '}
              <span className="text-xs sm:text-sm font-normal text-slate-400">FPS</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              丢帧率: <span className="font-mono text-slate-200">{stats.stutterRate.toFixed(1)}%</span>
            </div>
          </div>

          {/* KPI 6: Hardware Experience Grade */}
          <div
            onClick={() => setIsReportOpen(true)}
            className={`p-4 rounded-xl border shadow-xs cursor-pointer hover:border-cyan-500/50 transition-all ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>评定等级</span>
              <Award className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400 tracking-tight mt-1">
              {stats.grade}{' '}
              <span className="text-xs sm:text-sm font-sans font-normal text-slate-300">
                {stats.gradeTitle}
              </span>
            </div>
            <div className="text-xs text-cyan-400 flex items-center gap-0.5 mt-1 hover:underline">
              <span>查看完整报告</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </section>

        {/* Real-time Oscilloscope Dual-Trace Canvas */}
        <section>
          <OscilloscopeCanvas
            frames={displayFrames}
            nominalHz={stats.detectedHz}
            isDark={isDark}
            isPaused={!isTesting}
            timeWindowSec={timeWindowSec}
            onTimeWindowChange={sec => setTimeWindowSec(sec)}
          />
        </section>

        {/* Middle Section: Pacing Histogram & Visual Motion Clarity Test */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Histogram */}
          <FrameTimeHistogram
            frames={displayFrames}
            nominalHz={stats.detectedHz}
            isDark={isDark}
            frameTimeStdDevMs={stats.frameTimeStdDevMs}
          />

          {/* Visual Motion Clarity Glider (BlurBusters Style) */}
          <div id="motion">
            <MotionSyncTest
              nominalHz={stats.detectedHz}
              currentFps={stats.currentFps}
              isDark={isDark}
              stressLevel={stressLevel}
              onStressChange={level => setStressLevel(level)}
            />
          </div>
        </section>

        {/* Fluctuation & Stutter Log Table */}
        <section>
          <StutterLogTable
            events={displayStutters}
            isDark={isDark}
            onClear={() => {
              stuttersRef.current = [];
              setDisplayStutters([]);
            }}
            onExportCsv={handleExportCsv}
            onExportJson={handleExportJson}
          />
        </section>

        {/* Multi-Browser Compatibility & System Diagnostic Analysis */}
        <section id="compatibility">
          <CompatibilityAnalysis
            info={browserInfo}
            nominalHz={stats.detectedHz}
            isDark={isDark}
          />
        </section>
      </main>

      {/* Footer */}
      <footer
        className={`mt-12 py-6 border-t text-xs text-center transition-colors ${
          isDark
            ? 'bg-slate-950/80 border-slate-900 text-slate-500'
            : 'bg-white border-slate-200 text-slate-500'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            RefreshRate Lab · 基于高精度 HTML5 Canvas 与微秒级 performance.now() 帧定时管线
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => setIsReportOpen(true)}
              className="hover:text-cyan-400 transition-colors"
            >
              性能报告
            </button>
            <span>·</span>
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="hover:text-cyan-400 transition-colors"
            >
              对比历史 ({history.length})
            </button>
            <span>·</span>
            <button
              onClick={handleExportCsv}
              className="hover:text-cyan-400 transition-colors"
            >
              导出 CSV
            </button>
          </div>
        </div>
      </footer>

      {/* Performance Report Modal */}
      <PerformanceReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        stats={stats}
        browserInfo={browserInfo}
        isDark={isDark}
        onSaveToHistory={handleSaveToHistory}
        onExportCsv={handleExportCsv}
        onExportJson={handleExportJson}
      />

      {/* History Comparison Modal */}
      <HistoryComparisonModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        isDark={isDark}
        onDeleteHistoryItem={handleDeleteHistoryItem}
        onClearAll={handleClearHistory}
      />
    </div>
  );
}
