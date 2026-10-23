import React from 'react';
import { BenchmarkStats, BrowserSystemInfo } from '../types/benchmark';
import { X, Download, Printer, Save, CheckCircle2, ShieldCheck, Share2, Award } from 'lucide-react';

interface PerformanceReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: BenchmarkStats;
  browserInfo: BrowserSystemInfo;
  isDark: boolean;
  onSaveToHistory: () => void;
  onExportCsv: () => void;
  onExportJson: () => void;
}

export const PerformanceReportModal: React.FC<PerformanceReportModalProps> = ({
  isOpen,
  onClose,
  stats,
  browserInfo,
  isDark,
  onSaveToHistory,
  onExportCsv,
  onExportJson,
}) => {
  if (!isOpen) return null;

  const targetFrameMs = 1000 / (stats.detectedHz || 60);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className={`relative w-full max-w-4xl rounded-2xl border shadow-2xl overflow-hidden my-auto ${
        isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
      }`}>
        {/* Top Header Bar */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">屏幕刷新率性能诊断报告</h2>
              <div className="text-xs text-slate-400">
                生成时间: {new Date().toLocaleString()} · 标称 {stats.detectedHz} Hz
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              title="打印或另存为 PDF"
              className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">打印 / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Executive Grade Banner */}
          <div className={`p-5 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
            stats.grade === 'S+' || stats.grade === 'S'
              ? isDark ? 'bg-cyan-950/30 border-cyan-500/40' : 'bg-cyan-50 border-cyan-300'
              : stats.grade === 'A' || stats.grade === 'B'
              ? isDark ? 'bg-emerald-950/30 border-emerald-500/40' : 'bg-emerald-50 border-emerald-300'
              : isDark ? 'bg-amber-950/30 border-amber-500/40' : 'bg-amber-50 border-amber-300'
          }`}>
            <div className="flex items-center gap-4">
              {/* Grade Badge */}
              <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-bold text-2xl shadow-lg shrink-0 ${
                stats.grade === 'S+' || stats.grade === 'S'
                  ? 'bg-cyan-500 text-slate-950 shadow-cyan-500/20'
                  : stats.grade === 'A' || stats.grade === 'B'
                  ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
                  : 'bg-amber-500 text-slate-950 shadow-amber-500/20'
              }`}>
                <span>{stats.grade}</span>
                <span className="text-[10px] uppercase tracking-wider font-semibold opacity-80">Grade</span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold">{stats.gradeTitle}</h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    置信度: {stats.confidence}%
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-lg">
                  {stats.gradeSummary}
                </p>
              </div>
            </div>

            {/* Core Big Numbers */}
            <div className="flex items-center gap-6 text-right shrink-0">
              <div>
                <div className="text-[11px] text-slate-400 font-medium">标称刷新率</div>
                <div className="text-2xl font-bold font-mono text-cyan-400">
                  {stats.detectedHz} <span className="text-xs font-normal">Hz</span>
                </div>
              </div>
              <div className="border-l border-slate-700/60 pl-6">
                <div className="text-[11px] text-slate-400 font-medium">实测均值</div>
                <div className="text-2xl font-bold font-mono text-emerald-400">
                  {stats.avgFps.toFixed(1)} <span className="text-xs font-normal">FPS</span>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Telemetry Stats Grid */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              核心性能遥测指标 (Benchmark Telemetry)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className={`p-3 rounded-lg border ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="text-slate-400 text-[11px]">平均帧时间 (Frame Time)</div>
                <div className="text-lg font-bold font-mono text-slate-100 mt-1">
                  {stats.frameTimeAvgMs.toFixed(2)} <span className="text-xs font-normal text-slate-400">ms</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">理论基准: {targetFrameMs.toFixed(2)} ms</div>
              </div>

              <div className={`p-3 rounded-lg border ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="text-slate-400 text-[11px]">帧抖动标准差 (Jitter)</div>
                <div className="text-lg font-bold font-mono text-cyan-400 mt-1">
                  ±{stats.frameTimeStdDevMs.toFixed(2)} <span className="text-xs font-normal text-slate-400">ms</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">越低越稳定 (理想&lt;1.0ms)</div>
              </div>

              <div className={`p-3 rounded-lg border ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="text-slate-400 text-[11px]">1% Low 最低帧率</div>
                <div className="text-lg font-bold font-mono text-amber-400 mt-1">
                  {stats.fps1PercentLow.toFixed(1)} <span className="text-xs font-normal text-slate-400">FPS</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">0.1% Low: {stats.fps01PercentLow.toFixed(1)} FPS</div>
              </div>

              <div className={`p-3 rounded-lg border ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="text-slate-400 text-[11px]">丢帧与微卡顿率</div>
                <div className="text-lg font-bold font-mono text-slate-100 mt-1">
                  {stats.stutterRate.toFixed(1)}%
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">共丢失 {stats.droppedFrames} 帧 / 采 {stats.totalFrames} 帧</div>
              </div>
            </div>
          </div>

          {/* Test Environment Metadata */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              测试运行环境与硬件规格
            </h4>
            <div className={`p-4 rounded-xl border text-xs divide-y ${
              isDark ? 'bg-slate-950/50 border-slate-800 divide-slate-800/60' : 'bg-slate-50 border-slate-200 divide-slate-200'
            }`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">浏览器与引擎:</span>
                  <span className="font-semibold text-slate-200">{browserInfo.browserName} ({browserInfo.engine})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">操作系统平台:</span>
                  <span className="font-semibold text-slate-200">{browserInfo.os}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 py-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">显示分辨率与缩放:</span>
                  <span className="font-mono text-slate-200">{browserInfo.screenResolution} (DPR {browserInfo.devicePixelRatio}x)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">色彩深度与 HDR:</span>
                  <span className="text-slate-200">{browserInfo.colorDepth}bit · {browserInfo.hdrSupported ? '支持 HDR' : 'SDR'}</span>
                </div>
              </div>

              <div className="pt-3 flex flex-col gap-1">
                <span className="text-slate-400">WebGL GPU 渲染管线:</span>
                <span className="font-mono text-cyan-300 break-all text-[11px] bg-slate-900/60 p-1.5 rounded border border-slate-800">
                  {browserInfo.gpuRenderer}
                </span>
              </div>
            </div>
          </div>

          {/* Reference Grade Comparison Matrix */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              行业标准规格对比 (Industry Standards)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`font-mono text-[11px] ${
                  isDark ? 'bg-slate-950/70 text-slate-400 border-b border-slate-800' : 'bg-slate-100 text-slate-600 border-b border-slate-200'
                }`}>
                  <tr>
                    <th className="py-2 px-3">标准规格名称</th>
                    <th className="py-2 px-3">标称刷新率</th>
                    <th className="py-2 px-3">单帧预算</th>
                    <th className="py-2 px-3">适用设备与场景</th>
                    <th className="py-2 px-3">当前设备对比结果</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-[11px]">
                  <tr>
                    <td className="py-2 px-3 font-medium text-slate-200">标准办公显示器</td>
                    <td className="py-2 px-3 font-mono">60 Hz</td>
                    <td className="py-2 px-3 font-mono text-slate-400">16.67 ms</td>
                    <td className="py-2 px-3 text-slate-400">常规办公、网页浏览及影音流媒体</td>
                    <td className="py-2 px-3 font-semibold">
                      {stats.detectedHz >= 60 ? (
                        <span className="text-emerald-400">✓ 达到并超越基准</span>
                      ) : (
                        <span className="text-amber-400">未完全达到</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium text-slate-200">移动端/轻薄本 ProMotion</td>
                    <td className="py-2 px-3 font-mono">120 Hz</td>
                    <td className="py-2 px-3 font-mono text-slate-400">8.33 ms</td>
                    <td className="py-2 px-3 text-slate-400">iPhone / iPad Pro / MacBook Pro / 旗舰安卓机</td>
                    <td className="py-2 px-3 font-semibold">
                      {stats.detectedHz >= 120 ? (
                        <span className="text-emerald-400">✓ 达到高刷标准</span>
                      ) : (
                        <span className="text-slate-500">- 未达到 120Hz</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium text-slate-200">专业电竞游戏显示器</td>
                    <td className="py-2 px-3 font-mono">144 Hz - 165 Hz</td>
                    <td className="py-2 px-3 font-mono text-slate-400">6.94 ms - 6.06 ms</td>
                    <td className="py-2 px-3 text-slate-400">FPS / MOBA 竞技游戏，极低拖影与动态模糊</td>
                    <td className="py-2 px-3 font-semibold">
                      {stats.detectedHz >= 144 ? (
                        <span className="text-emerald-400">✓ 达到电竞标准</span>
                      ) : (
                        <span className="text-slate-500">- 未达到 144Hz</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium text-slate-200">顶级职业电竞赛级</td>
                    <td className="py-2 px-3 font-mono">240 Hz - 360 Hz</td>
                    <td className="py-2 px-3 font-mono text-slate-400">4.17 ms - 2.78 ms</td>
                    <td className="py-2 px-3 text-slate-400">职业电竞战队、极限输入延迟要求</td>
                    <td className="py-2 px-3 font-semibold">
                      {stats.detectedHz >= 240 ? (
                        <span className="text-cyan-400 font-bold">★ 顶级电竞赛级</span>
                      ) : (
                        <span className="text-slate-500">- 未达到 240Hz</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className={`flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t ${
          isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <div className="flex items-center gap-2">
            <button
              onClick={onSaveToHistory}
              className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>保存到本地历史对比库</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onExportCsv}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-200' : 'border-slate-300 hover:bg-slate-200 text-slate-800'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>导出原始帧数据 (CSV)</span>
            </button>
            <button
              onClick={onExportJson}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-200' : 'border-slate-300 hover:bg-slate-200 text-slate-800'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>导出 JSON 报告</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
