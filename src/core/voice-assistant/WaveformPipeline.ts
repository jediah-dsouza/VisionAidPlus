import { logger } from '../debug';
import { eventBus } from '../events/EventBus';
import { VOICE_EVENTS } from './VoiceEventBus';
import type { WaveformFrame, WaveformSegment, VoiceAssistantConfig } from './types';
import { DEFAULT_VOICE_CONFIG } from './types';

export class WaveformPipeline {
  private config: VoiceAssistantConfig;
  private currentSegment: WaveformSegment | null = null;
  private segments: WaveformSegment[] = [];
  private destroyed = false;
  private active = false;
  private frameTimer: ReturnType<typeof setInterval> | null = null;
  private frameCount = 0;

  constructor(config: Partial<VoiceAssistantConfig> = {}) {
    this.config = { ...DEFAULT_VOICE_CONFIG, ...config };
  }

  startSegment(id: string): void {
    if (this.destroyed) return;

    this.currentSegment = {
      id,
      frames: [],
      durationMs: 0,
      startTime: Date.now(),
      endTime: 0,
      peak: 0,
      rms: 0,
    };

    this.active = true;
    this.frameCount = 0;

    this.frameTimer = setInterval(() => {
      if (!this.currentSegment || !this.active) return;

      const frame: WaveformFrame = {
        amplitude: this.simulateAmplitude(),
        frequency: 200 + Math.random() * 200,
        timestamp: Date.now(),
      };

      this.currentSegment.frames.push(frame);

      if (frame.amplitude > this.currentSegment.peak) {
        this.currentSegment.peak = frame.amplitude;
      }

      this.frameCount++;

      if (this.frameCount % 5 === 0) {
        eventBus.publish(VOICE_EVENTS.WAVEFORM_UPDATE, {
          segmentId: id,
          latestAmplitude: frame.amplitude,
          peak: this.currentSegment.peak,
          frameCount: this.frameCount,
        }, 'low');
      }
    }, 100);

    logger.info(`[Waveform] Segment started: ${id}`);
  }

  endSegment(): WaveformSegment | null {
    if (!this.currentSegment || !this.active) return null;

    this.active = false;
    this.stopFrameTimer();

    this.currentSegment.endTime = Date.now();
    this.currentSegment.durationMs = this.currentSegment.endTime - this.currentSegment.startTime;

    if (this.currentSegment.frames.length > 0) {
      const sumSquares = this.currentSegment.frames.reduce(
        (sum, f) => sum + f.amplitude * f.amplitude, 0,
      );
      this.currentSegment.rms = Math.sqrt(sumSquares / this.currentSegment.frames.length);
    }

    const segment = this.currentSegment;
    this.segments.push(segment);

    if (this.segments.length > 50) {
      this.segments.splice(0, this.segments.length - 50);
    }

    eventBus.publish(VOICE_EVENTS.WAVEFORM_SEGMENT_COMPLETE, {
      segment,
      totalFrames: segment.frames.length,
      peak: segment.peak,
      rms: segment.rms,
    }, 'low');

    this.currentSegment = null;
    logger.info(`[Waveform] Segment ended: ${segment.id} (${segment.durationMs}ms)`);
    return segment;
  }

  getCurrentSegment(): WaveformSegment | null {
    return this.currentSegment;
  }

  getRecentSegments(count: number = 5): WaveformSegment[] {
    return this.segments.slice(-count);
  }

  getLatestFrames(limit: number = 20): WaveformFrame[] {
    if (!this.currentSegment) return [];
    return this.currentSegment.frames.slice(-limit);
  }

  isActive(): boolean {
    return this.active;
  }

  private simulateAmplitude(): number {
    const base = Math.sin(Date.now() / 200) * 0.5 + 0.5;
    const noise = Math.random() * 0.3;
    return Math.min(1, Math.max(0, base + noise));
  }

  private stopFrameTimer(): void {
    if (this.frameTimer) {
      clearInterval(this.frameTimer);
      this.frameTimer = null;
    }
  }

  clear(): void {
    this.stopFrameTimer();
    this.currentSegment = null;
    this.segments = [];
    this.active = false;
    this.frameCount = 0;
  }

  destroy(): void {
    this.destroyed = true;
    this.clear();
    logger.info('[Waveform] Destroyed');
  }
}
