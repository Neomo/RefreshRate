export interface FrameRecord {
  index: number;
  timestamp: number; // performance.now()
  deltaMs: number;
  fps: number;
  isStutter: boolean;
  isSevereStutter: boolean;
}

export type GradeLevel = 'S+' | 'S' | 'A' | 'B' | 'C' | 'D';

export interface BenchmarkStats {
  currentFps: number;
  avgFps: number;
  medianFps: number;
  minFps: number;
  maxFps: number;
  fps1PercentLow: number;
  fps01PercentLow: number;
  detectedHz: number;
  confidence: number; // 0 - 100%
  frameTimeAvgMs: number;
  frameTimeStdDevMs: number; // Jitter
  totalFrames: number;
  droppedFrames: number;
  stutterRate: number; // percentage of frames with >25% deviation
  testDurationMs: number;
  grade: GradeLevel;
  gradeTitle: string;
  gradeSummary: string;
}

export interface StutterEvent {
  id: string;
  timestamp: number;
  timeOffsetMs: number;
  frameIndex: number;
  deltaMs: number;
  expectedMs: number;
  deviationPercent: number;
  severity: 'mild' | 'moderate' | 'severe';
  possibleCause: string;
}

export interface BrowserSystemInfo {
  browserName: string;
  browserVersion: string;
  engine: string;
  os: string;
  gpuRenderer: string;
  gpuVendor: string;
  screenResolution: string;
  viewportSize: string;
  devicePixelRatio: number;
  colorDepth: number;
  hdrSupported: boolean;
  touchSupported: boolean;
  maxTouchPoints: number;
  isHighRefreshCapSuspected: boolean;
  hardwareConcurrency: number;
  deviceMemoryGb?: number;
  connectionType?: string;
  notes: string[];
}

export interface BenchmarkHistoryItem {
  id: string;
  timestamp: number;
  formattedDate: string;
  testDurationSec: number;
  stats: BenchmarkStats;
  browserInfo: BrowserSystemInfo;
  label: string;
}

export type TestMode = 'continuous' | 'timed';

export interface ReferenceProfile {
  name: string;
  hz: number;
  targetFrameMs: number;
  idealJitterMs: number;
  description: string;
  category: string;
}
