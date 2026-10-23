import React, { useState } from 'react';
import { BrowserSystemInfo } from '../types/benchmark';
import { Cpu, Monitor, CheckCircle2, AlertCircle, Info, Sparkles, ExternalLink, HelpCircle } from 'lucide-react';

interface CompatibilityAnalysisProps {
  info: BrowserSystemInfo;
  nominalHz: number;
  isDark: boolean;
}

export const CompatibilityAnalysis: React.FC<CompatibilityAnalysisProps> = ({
  info,
  nominalHz,
  isDark,
}) => {
  const [activeTab, setActiveTab] = useState<'current' | 'matrix' | 'guide'>('current');

  return (
    <div className={`rounded-xl border ${
      isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
    } p-4 transition-colors`}>
      {/* Title & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold tracking-tight">
            环境规格与多浏览器兼容性分析
          </h3>
        </div>

        {/* Tab switcher */}
        <div className={`flex items-center p-0.5 rounded-lg border text-xs ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            onClick={() => setActiveTab('current')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              activeTab === 'current'
                ? isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            当前设备与环境
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              activeTab === 'matrix'
                ? isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            跨浏览器高刷特性矩阵
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              activeTab === 'guide'
                ? isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            高刷调优诊断指南
          </button>
        </div>
      </div>

      {/* Tab 1: Current Hardware & Environment Specs */}
      {activeTab === 'current' && (
        <div className="space-y-4">
          {/* Spec Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 text-xs">
            <div className={`p-2.5 rounded-lg border ${
              isDark ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-slate-400 text-[11px] mb-1">浏览器与内核</div>
              <div className="font-semibold text-slate-200 truncate">{info.browserName}</div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">{info.engine}</div>
            </div>

            <div className={`p-2.5 rounded-lg border ${
              isDark ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-slate-400 text-[11px] mb-1">操作系统平台</div>
              <div className="font-semibold text-slate-200">{info.os}</div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">CPU核心: {info.hardwareConcurrency}核</div>
            </div>

            <div className={`p-2.5 rounded-lg border ${
              isDark ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-slate-400 text-[11px] mb-1">屏幕分辨率与缩放</div>
              <div className="font-semibold text-slate-200 font-mono">{info.screenResolution}</div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">DPR: {info.devicePixelRatio}x · 深度: {info.colorDepth}bit</div>
            </div>

            <div className={`p-2.5 rounded-lg border ${
              isDark ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-slate-400 text-[11px] mb-1">高动态范围 (HDR)</div>
              <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                {info.hdrSupported ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>支持 HDR 色域</span>
                  </>
                ) : (
                  <>
                    <span className="text-slate-400">标准动态范围 (SDR)</span>
                  </>
                )}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                触控点: {info.touchSupported ? `${info.maxTouchPoints} 点触控` : '不支持触控'}
              </div>
            </div>
          </div>

          {/* GPU Hardware string */}
          <div className={`p-3 rounded-lg border flex flex-col gap-1 text-xs ${
            isDark ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>GPU 渲染器 (WebGL Hardware Renderer)</span>
            </div>
            <div className="font-mono text-cyan-300 break-all select-all text-[11px] bg-slate-900/60 p-2 rounded border border-slate-800">
              {info.gpuRenderer}
            </div>
          </div>

          {/* Engine diagnostic advice */}
          {info.notes.length > 0 && (
            <div className={`p-3 rounded-lg border space-y-1.5 text-xs ${
              isDark ? 'bg-cyan-950/20 border-cyan-800/40 text-cyan-200' : 'bg-cyan-50 border-cyan-200 text-cyan-900'
            }`}>
              <div className="flex items-center gap-1.5 font-semibold text-cyan-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>针对当前环境的检测建议</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px] pl-1">
                {info.notes.map((note, idx) => (
                  <li key={idx} className="leading-relaxed">{note}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Cross-Browser Comparison Matrix */}
      {activeTab === 'matrix' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`font-mono text-[11px] ${
              isDark ? 'bg-slate-950/80 text-slate-400 border-b border-slate-800' : 'bg-slate-100 text-slate-600 border-b border-slate-200'
            }`}>
              <tr>
                <th className="py-2.5 px-3">浏览器 / 引擎</th>
                <th className="py-2.5 px-3">最高支持刷新率</th>
                <th className="py-2.5 px-3">VSync 同步机制</th>
                <th className="py-2.5 px-3">后台标签页限帧</th>
                <th className="py-2.5 px-3">常见高刷异常及排查</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-[11px]">
              <tr className={isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-100/50'}>
                <td className="py-2 px-3 font-semibold text-slate-200">
                  Google Chrome / Edge (Blink)
                </td>
                <td className="py-2 px-3 text-cyan-400 font-mono font-medium">
                  500 Hz+ (无硬限制)
                </td>
                <td className="py-2 px-3 text-slate-300">
                  绑定系统合成器 VSync 信号
                </td>
                <td className="py-2 px-3 text-amber-400 font-mono">
                  严格降至 1~30 FPS
                </td>
                <td className="py-2 px-3 text-slate-400">
                  多显示器混用时若将窗口拖入高刷屏，可能仍锁在主屏 60Hz，需在系统设置中确认主屏幕刷新率。
                </td>
              </tr>
              <tr className={isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-100/50'}>
                <td className="py-2 px-3 font-semibold text-slate-200">
                  Apple Safari (WebKit)
                </td>
                <td className="py-2 px-3 text-cyan-400 font-mono font-medium">
                  120 Hz (ProMotion)
                </td>
                <td className="py-2 px-3 text-slate-300">
                  DisplayLink 硬件自适应驱动
                </td>
                <td className="py-2 px-3 text-amber-400 font-mono">
                  冻结或降至 0~10 FPS
                </td>
                <td className="py-2 px-3 text-slate-400">
                  macOS/iOS 低电量模式下强制锁定 60Hz；Safari 实验特性中若未开启 Full ProMotion 限制帧率。
                </td>
              </tr>
              <tr className={isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-100/50'}>
                <td className="py-2 px-3 font-semibold text-slate-200">
                  Mozilla Firefox (Gecko)
                </td>
                <td className="py-2 px-3 text-cyan-400 font-mono font-medium">
                  360 Hz+ (无硬限制)
                </td>
                <td className="py-2 px-3 text-slate-300">
                  独立合成器线程 (WR)
                </td>
                <td className="py-2 px-3 text-amber-400 font-mono">
                  节流降帧 (Throttled)
                </td>
                <td className="py-2 px-3 text-slate-400">
                  若遇到帧率锁死在 60Hz，可在 about:config 中检查 layout.frame_rate 是否为 0（默认跟随硬件）。
                </td>
              </tr>
              <tr className={isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-100/50'}>
                <td className="py-2 px-3 font-semibold text-slate-200">
                  移动端浏览器 (iOS / Android)
                </td>
                <td className="py-2 px-3 text-cyan-400 font-mono font-medium">
                  90 Hz / 120 Hz
                </td>
                <td className="py-2 px-3 text-slate-300">
                  触摸交互动态提频 (VRR)
                </td>
                <td className="py-2 px-3 text-amber-400 font-mono">
                  熄屏或切出后台休眠
                </td>
                <td className="py-2 px-3 text-slate-400">
                  部分手机为省电仅在手指滑动屏幕时才拉满 120Hz，静止时会自动降频至 60Hz 甚至 30Hz（LTPO 策略）。
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Tuning & Troubleshooting Guide */}
      {activeTab === 'guide' && (
        <div className="space-y-3 text-xs">
          <div className={`p-3 rounded-lg border ${
            isDark ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
          }`}>
            <h4 className="font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              1. 为什么我的 144Hz/240Hz 屏幕实测只有 60Hz？
            </h4>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              - <strong>Windows 系统设置：</strong> 进入「设置」→「系统」→「屏幕」→「高级显示设置」，检查刷新率是否手动调为了 144Hz/240Hz（许多系统新接显示器默认为 60Hz）。<br />
              - <strong>浏览器硬件加速：</strong> 确保浏览器设置中的「使用图形硬件加速」已开启，若关闭则走纯 CPU 渲染，无法实现稳定高帧率。<br />
              - <strong>显卡控制面板：</strong> NVIDIA 控制面板或 AMD Adrenalin 中检查 G-Sync / FreeSync 及全局垂直同步设置。
            </p>
          </div>

          <div className={`p-3 rounded-lg border ${
            isDark ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
          }`}>
            <h4 className="font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              2. MacBook Pro / iPad Pro ProMotion 120Hz 测试说明
            </h4>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              - Apple 的 ProMotion 技术采用可变刷新率（VRR，24Hz-120Hz）。<br />
              - 若实测为 60Hz，请确认是否拔掉了电源线且处于「低电量模式」（系统偏好设置中关闭低电量模式后重试）。
            </p>
          </div>

          <div className={`p-3 rounded-lg border ${
            isDark ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
          }`}>
            <h4 className="font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              3. 如何减少测试过程中的突发抖动与丢帧？
            </h4>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              - 尽量将当前测试标签页保持在前台全屏显示，避免其他重度视频播放或 3D 渲染标签页占用 GPU 显存带宽。<br />
              - 开启本应用内置的 15s 或 30s 基准测试模式，在预热消除初始 GC 干扰后即可获得极高置信度。
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
