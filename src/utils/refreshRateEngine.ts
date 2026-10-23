import { BenchmarkStats, GradeLevel, StutterEvent } from '../types/benchmark';

// Standard screen refresh rates in Hz
export const STANDARD_REFRESH_RATES = [
  30, 48, 50, 59.94, 60, 72, 75, 85, 90, 100, 120, 144, 165, 180, 200, 240, 280, 360, 480, 500
];

/**
 * Finds the closest nominal display refresh rate for a given measured frame rate.
 */
export function matchNominalRefreshRate(measuredFps: number): { nominalHz: number; isStandard: boolean } {
  if (measuredFps <= 0) return { nominalHz: 60, isStandard: false };

  // Handle common 59.94Hz as 60Hz display standard
  if (measuredFps >= 59.0 && measuredFps <= 60.5) {
    return { nominalHz: 60, isStandard: true };
  }

  for (const rate of STANDARD_REFRESH_RATES) {
    const diff = Math.abs(measuredFps - rate);
    // Allow up to 3.5% deviation
    if (diff / rate <= 0.035) {
      return { nominalHz: Math.round(rate), isStandard: true };
    }
  }

  // Non-standard or dynamic VRR rate
  return { nominalHz: Math.round(measuredFps), isStandard: false };
}

/**
 * Calculates statistical metrics from an array of frame intervals (in milliseconds).
 */
export function calculateBenchmarkStats(
  deltasMs: number[],
  durationMs: number
): BenchmarkStats {
  if (deltasMs.length === 0) {
    return {
      currentFps: 0,
      avgFps: 0,
      medianFps: 0,
      minFps: 0,
      maxFps: 0,
      fps1PercentLow: 0,
      fps01PercentLow: 0,
      detectedHz: 60,
      confidence: 0,
      frameTimeAvgMs: 16.67,
      frameTimeStdDevMs: 0,
      totalFrames: 0,
      droppedFrames: 0,
      stutterRate: 0,
      testDurationMs: durationMs,
      grade: 'B',
      gradeTitle: '待测试',
      gradeSummary: '等待开始基准测试',
    };
  }

  const count = deltasMs.length;
  // Calculate instantaneous FPS for each frame
  const fpsList = deltasMs.map(d => (d > 0 ? 1000 / d : 0));
  
  // Sort frame intervals and FPS
  const sortedDeltas = [...deltasMs].sort((a, b) => a - b);
  const sortedFps = [...fpsList].sort((a, b) => a - b);

  // Mean frame time
  const sumDelta = deltasMs.reduce((acc, val) => acc + val, 0);
  const frameTimeAvgMs = sumDelta / count;

  // Average FPS
  const avgFps = count > 0 && sumDelta > 0 ? (count * 1000) / sumDelta : 0;
  const currentFps = fpsList[fpsList.length - 1] || avgFps;

  // Median FPS
  const midIndex = Math.floor(count / 2);
  const medianFps = count % 2 === 0 ? (sortedFps[midIndex - 1] + sortedFps[midIndex]) / 2 : sortedFps[midIndex];

  // Min / Max FPS (ignoring first 2 warmup frames if possible)
  const safeFpsList = count > 5 ? sortedFps.slice(2, count - 1) : sortedFps;
  const minFps = safeFpsList[0] || sortedFps[0];
  const maxFps = safeFpsList[safeFpsList.length - 1] || sortedFps[sortedFps.length - 1];

  // 1% Low and 0.1% Low (Percentiles of slowest frames, corresponding to lowest FPS)
  const index1Percent = Math.max(0, Math.floor(count * 0.01));
  const index01Percent = Math.max(0, Math.floor(count * 0.001));
  const fps1PercentLow = sortedFps[index1Percent] || minFps;
  const fps01PercentLow = sortedFps[index01Percent] || minFps;

  // Standard deviation of frame intervals (Jitter)
  const variance = deltasMs.reduce((acc, val) => acc + Math.pow(val - frameTimeAvgMs, 2), 0) / count;
  const frameTimeStdDevMs = Math.sqrt(variance);

  // Detect nominal Hz
  const { nominalHz } = matchNominalRefreshRate(medianFps);
  const expectedFrameMs = 1000 / nominalHz;

  // Count stutters and dropped frames
  let droppedFrames = 0;
  let stutterCount = 0;

  for (const delta of deltasMs) {
    if (delta > expectedFrameMs * 1.25) {
      stutterCount++;
    }
    if (delta > expectedFrameMs * 1.7) {
      const droppedInThisInterval = Math.max(1, Math.round(delta / expectedFrameMs) - 1);
      droppedFrames += droppedInThisInterval;
    }
  }

  const stutterRate = count > 0 ? (stutterCount / count) * 100 : 0;

  // Confidence calculation (0-100%)
  // High confidence if standard deviation is low and we have at least 60 frames
  let confidence = Math.max(0, 100 - (frameTimeStdDevMs / expectedFrameMs) * 150);
  if (count < 30) confidence = Math.min(confidence, 40);
  else if (count < 60) confidence = Math.min(confidence, 70);
  confidence = Math.min(100, Math.max(10, Math.round(confidence)));

  // Hardware Grade Evaluation
  let grade: GradeLevel = 'B';
  let gradeTitle = '标准流畅级';
  let gradeSummary = '符合标准 60Hz 办公及影音播放水准，帧时间平稳。';

  if (nominalHz >= 200 && frameTimeStdDevMs < 1.2 && stutterRate < 0.5) {
    grade = 'S+';
    gradeTitle = '电竞巅峰级';
    gradeSummary = '具备极高刷新率与微秒级精准帧同步，能够呈现极致丝滑的动态响应与最低系统延迟。';
  } else if (nominalHz >= 120 && frameTimeStdDevMs < 1.5 && stutterRate < 1.2) {
    grade = 'S';
    gradeTitle = '高刷专业级';
    gradeSummary = '匹配 120Hz/144Hz 专业高刷显示器或移动端 ProMotion，动效丝滑，无明显微卡顿。';
  } else if (nominalHz >= 90 && frameTimeStdDevMs < 2.0 && stutterRate < 2.0) {
    grade = 'A';
    gradeTitle = '流畅进阶级';
    gradeSummary = '优于普通 60Hz 显示器，具备良好的动态清晰度，帧间隔分布较为均匀。';
  } else if (nominalHz >= 58 && frameTimeStdDevMs < 2.5 && stutterRate < 3.0) {
    grade = 'B';
    gradeTitle = '标准主流级';
    gradeSummary = '符合 60Hz 标准显示规格，能够流畅处理日常网页浏览及高保真界面交互。';
  } else if (frameTimeStdDevMs < 4.0 && stutterRate < 6.0) {
    grade = 'C';
    gradeTitle = '轻度波动级';
    gradeSummary = '检测到偶发丢帧或帧率波动，建议排查后台高负载进程或浏览器硬件加速设置。';
  } else {
    grade = 'D';
    gradeTitle = '明显卡顿级';
    gradeSummary = '检测到较为频繁的帧率骤降与垂直同步丢失，可能存在浏览器限帧、省电模式或合成器争用。';
  }

  return {
    currentFps: Math.round(currentFps * 10) / 10,
    avgFps: Math.round(avgFps * 10) / 10,
    medianFps: Math.round(medianFps * 10) / 10,
    minFps: Math.round(minFps * 10) / 10,
    maxFps: Math.round(maxFps * 10) / 10,
    fps1PercentLow: Math.round(fps1PercentLow * 10) / 10,
    fps01PercentLow: Math.round(fps01PercentLow * 10) / 10,
    detectedHz: nominalHz,
    confidence,
    frameTimeAvgMs: Math.round(frameTimeAvgMs * 100) / 100,
    frameTimeStdDevMs: Math.round(frameTimeStdDevMs * 100) / 100,
    totalFrames: count,
    droppedFrames,
    stutterRate: Math.round(stutterRate * 10) / 10,
    testDurationMs: durationMs,
    grade,
    gradeTitle,
    gradeSummary,
  };
}

/**
 * Evaluates a single frame delta to see if it qualifies as a stutter event.
 */
export function analyzeStutter(
  deltaMs: number,
  expectedMs: number,
  frameIndex: number,
  timeOffsetMs: number
): StutterEvent | null {
  const deviation = deltaMs - expectedMs;
  const deviationPercent = Math.round((deviation / expectedMs) * 100);

  if (deviationPercent < 25) {
    return null; // Normal tolerance
  }

  let severity: 'mild' | 'moderate' | 'severe' = 'mild';
  let possibleCause = '微小帧抖动 / 渲染排队';

  if (deviationPercent >= 100) {
    severity = 'severe';
    const missedFrames = Math.max(1, Math.round(deltaMs / expectedMs) - 1);
    possibleCause = `丢失 ${missedFrames} 帧垂直同步 (可能因垃圾回收 GC 或主线程长时间阻塞)`;
  } else if (deviationPercent >= 50) {
    severity = 'moderate';
    possibleCause = '合成器调度延迟 / 页面重排或 GPU 上下文切换';
  } else {
    severity = 'mild';
    possibleCause = '垂直同步时间微调 / 操作系统定时器轻度抖动';
  }

  return {
    id: `stutter_${frameIndex}_${Math.round(timeOffsetMs)}`,
    timestamp: Date.now(),
    timeOffsetMs: Math.round(timeOffsetMs),
    frameIndex,
    deltaMs: Math.round(deltaMs * 100) / 100,
    expectedMs: Math.round(expectedMs * 100) / 100,
    deviationPercent,
    severity,
    possibleCause,
  };
}
