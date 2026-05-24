import { WaveformPipeline } from '../../src/core/voice-assistant/WaveformPipeline';

jest.mock('../../src/core/events/EventBus', () => ({
  eventBus: {
    subscribe: jest.fn(() => jest.fn()),
    publish: jest.fn(),
  },
  EVENTS: {},
}));

jest.mock('../../src/core/debug', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

describe('WaveformPipeline', () => {
  let waveform: WaveformPipeline;

  beforeEach(() => {
    jest.useFakeTimers({ now: 1000000 });
    jest.clearAllMocks();
    waveform = new WaveformPipeline();
  });

  afterEach(() => {
    waveform.destroy();
    jest.useRealTimers();
  });

  it('starts with no frames', () => {
    expect(waveform.getLatestFrames()).toEqual([]);
    expect(waveform.getCurrentSegment()).toBeNull();
  });

  it('isActive returns false initially', () => {
    expect(waveform.isActive()).toBe(false);
  });

  it('startSegment begins a new segment', () => {
    waveform.startSegment('seg_1');
    expect(waveform.isActive()).toBe(true);
    expect(waveform.getCurrentSegment()?.id).toBe('seg_1');
  });

  it('produces frames during segment', () => {
    waveform.startSegment('seg_1');
    jest.advanceTimersByTime(500);
    const frames = waveform.getLatestFrames();
    expect(frames.length).toBeGreaterThanOrEqual(3);
    expect(frames.length).toBeLessThanOrEqual(8);
  });

  it('endSegment completes the segment', () => {
    waveform.startSegment('seg_1');
    jest.advanceTimersByTime(300);
    const segment = waveform.endSegment();
    expect(segment).not.toBeNull();
    expect(segment!.id).toBe('seg_1');
    expect(segment!.durationMs).toBeGreaterThanOrEqual(200);
    expect(segment!.endTime).toBeGreaterThan(0);
  });

  it('frames have correct structure', () => {
    waveform.startSegment('seg_1');
    jest.advanceTimersByTime(200);
    const frames = waveform.getLatestFrames();
    expect(frames[0]).toHaveProperty('amplitude');
    expect(frames[0]).toHaveProperty('frequency');
    expect(frames[0]).toHaveProperty('timestamp');
    expect(frames[0].amplitude).toBeGreaterThanOrEqual(0);
    expect(frames[0].amplitude).toBeLessThanOrEqual(1);
    waveform.endSegment();
  });

  it('endSegment returns null if no active segment', () => {
    expect(waveform.endSegment()).toBeNull();
  });

  it('endSegment returns null if not active', () => {
    waveform.startSegment('seg_1');
    jest.advanceTimersByTime(100);
    waveform.endSegment();
    expect(waveform.endSegment()).toBeNull();
  });

  it('stops producing frames after end', () => {
    waveform.startSegment('seg_1');
    jest.advanceTimersByTime(300);
    waveform.endSegment();
    jest.advanceTimersByTime(500);
    expect(waveform.getLatestFrames()).toEqual([]);
  });

  it('publishes WAVEFORM_UPDATE events', () => {
    const { eventBus } = jest.requireMock('../../src/core/events/EventBus');
    waveform.startSegment('seg_1');
    jest.advanceTimersByTime(600);
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.stringContaining('WAVEFORM_UPDATE'),
      expect.objectContaining({ segmentId: 'seg_1' }),
      'low',
    );
    waveform.endSegment();
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.stringContaining('WAVEFORM_SEGMENT_COMPLETE'),
      expect.any(Object),
      'low',
    );
  });

  it('clear resets pipeline state', () => {
    waveform.startSegment('seg_1');
    jest.advanceTimersByTime(300);
    waveform.endSegment();
    waveform.clear();
    expect(waveform.getCurrentSegment()).toBeNull();
    expect(waveform.getLatestFrames()).toEqual([]);
    expect(waveform.isActive()).toBe(false);
  });

  it('getRecentSegments returns completed segments', () => {
    waveform.startSegment('seg_1');
    jest.advanceTimersByTime(100);
    waveform.endSegment();
    waveform.startSegment('seg_2');
    jest.advanceTimersByTime(100);
    waveform.endSegment();
    const recent = waveform.getRecentSegments();
    expect(recent.length).toBe(2);
    expect(recent[0].id).toBe('seg_1');
    expect(recent[1].id).toBe('seg_2');
  });

  it('getRecentSegments respects limit', () => {
    for (let i = 0; i < 10; i++) {
      waveform.startSegment(`seg_${i}`);
      jest.advanceTimersByTime(50);
      waveform.endSegment();
    }
    expect(waveform.getRecentSegments(3).length).toBe(3);
  });
});
