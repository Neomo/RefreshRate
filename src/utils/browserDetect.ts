import { BrowserSystemInfo } from '../types/benchmark';

export function detectBrowserAndSystem(): BrowserSystemInfo {
  const ua = navigator.userAgent;
  let browserName = '未知浏览器';
  let browserVersion = '1.0';
  let engine = '未知引擎';
  let os = '未知操作系统';

  // OS detection
  if (/Windows NT 10.0/i.test(ua)) os = 'Windows 10/11';
  else if (/Windows NT 6.3/i.test(ua)) os = 'Windows 8.1';
  else if (/Windows NT 6.1/i.test(ua)) os = 'Windows 7';
  else if (/Macintosh|Mac OS X/i.test(ua)) {
    const match = ua.match(/Mac OS X ([0-9_]+)/);
    os = match ? `macOS ${match[1].replace(/_/g, '.')}` : 'macOS';
  } else if (/Android/i.test(ua)) {
    const match = ua.match(/Android ([0-9.]+)/);
    os = match ? `Android ${match[1]}` : 'Android';
  } else if (/iPhone|iPad|iPod/i.test(ua)) {
    const match = ua.match(/OS ([0-9_]+)/);
    os = match ? `iOS ${match[1].replace(/_/g, '.')}` : 'iOS';
  } else if (/Linux/i.test(ua)) {
    os = 'Linux';
  }

  // Engine & Browser detection
  if (/Edg\/([0-9.]+)/i.test(ua)) {
    browserName = 'Microsoft Edge';
    browserVersion = ua.match(/Edg\/([0-9.]+)/i)?.[1] || '';
    engine = 'Blink (Chromium)';
  } else if (/OPR\/([0-9.]+)/i.test(ua)) {
    browserName = 'Opera';
    browserVersion = ua.match(/OPR\/([0-9.]+)/i)?.[1] || '';
    engine = 'Blink (Chromium)';
  } else if (/Chrome\/([0-9.]+)/i.test(ua) && !/Edg|OPR|Brave/i.test(ua)) {
    browserName = 'Google Chrome';
    browserVersion = ua.match(/Chrome\/([0-9.]+)/i)?.[1] || '';
    engine = 'Blink (Chromium)';
  } else if (/Firefox\/([0-9.]+)/i.test(ua)) {
    browserName = 'Mozilla Firefox';
    browserVersion = ua.match(/Firefox\/([0-9.]+)/i)?.[1] || '';
    engine = 'Gecko';
  } else if (/Safari\/([0-9.]+)/i.test(ua) && !/Chrome|Android/i.test(ua)) {
    browserName = 'Apple Safari';
    const match = ua.match(/Version\/([0-9.]+)/i);
    browserVersion = match ? match[1] : '';
    engine = 'WebKit';
  }

  // GPU detection via WebGL
  let gpuRenderer = '无法获取 (硬件加速未启用或被隐私保护)';
  let gpuVendor = '未知';
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        gpuRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '未知渲染器';
        gpuVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '未知厂商';
      } else {
        gpuRenderer = gl.getParameter(gl.RENDERER) || '默认 WebGL 渲染管线';
        gpuVendor = gl.getParameter(gl.VENDOR) || '标准厂商';
      }
    }
  } catch {
    gpuRenderer = 'WebGL 初始化失败';
  }

  // HDR check
  const hdrSupported = window.matchMedia && window.matchMedia('(dynamic-range: high)').matches;

  // Touch support
  const touchSupported = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const maxTouchPoints = navigator.maxTouchPoints || 0;

  // Screen specs
  const screenResolution = `${window.screen.width} × ${window.screen.height}`;
  const viewportSize = `${window.innerWidth} × ${window.innerHeight}`;
  const devicePixelRatio = Math.round((window.devicePixelRatio || 1) * 100) / 100;
  const colorDepth = window.screen.colorDepth || 24;
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;
  
  // @ts-expect-error deviceMemory is non-standard
  const deviceMemoryGb = navigator.deviceMemory as number | undefined;

  // @ts-expect-error connection is non-standard
  const connectionType = navigator.connection?.effectiveType as string | undefined;

  // Diagnostics notes
  const notes: string[] = [];
  let isHighRefreshCapSuspected = false;

  if (browserName.includes('Safari') && (os.includes('macOS') || os.includes('iOS'))) {
    notes.push('WebKit 引擎默认可能在低电量或未开启高刷支持时将 requestAnimationFrame 限制在 60Hz。若屏幕为 120Hz ProMotion，请检查是否处于省电模式或 Safari 开发者设置中是否限制了帧率。');
    isHighRefreshCapSuspected = true;
  }

  if (engine.includes('Chromium')) {
    notes.push('Chromium 引擎严格与系统垂直同步 (VSync) 绑定，在多显示器环境下会优先参考主显示器或当前窗口所在显示器的刷新率。');
  }

  if (engine.includes('Gecko')) {
    notes.push('Firefox 在部分系统上需在 about:config 中调整 layout.frame_rate 参数以突破某些特定显示模式的帧率同步。');
  }

  if (devicePixelRatio > 1) {
    notes.push(`检测到高分辨率屏幕缩放 (DPR: ${devicePixelRatio})，已自动优化 Canvas 渲染以匹配物理像素网格。`);
  }

  if (hdrSupported) {
    notes.push('当前显示设备支持高动态范围 (HDR) 内容输出。');
  }

  return {
    browserName,
    browserVersion,
    engine,
    os,
    gpuRenderer,
    gpuVendor,
    screenResolution,
    viewportSize,
    devicePixelRatio,
    colorDepth,
    hdrSupported,
    touchSupported,
    maxTouchPoints,
    isHighRefreshCapSuspected,
    hardwareConcurrency,
    deviceMemoryGb,
    connectionType,
    notes,
  };
}
