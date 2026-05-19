import { SpeechController } from '../../src/core/accessibility/SpeechController';
import { voiceQueue } from '../../src/core/accessibility/VoiceQueue';

jest.mock('../../src/core/accessibility/VoiceQueue', () => {
  const messages: any[] = [];
  return {
    voiceQueue: {
      add: jest.fn((msg: any) => {
        messages.push(msg);
        return 'id';
      }),
      peek: jest.fn(() => messages[0] || null),
      pop: jest.fn(() => messages.shift() || null),
      interrupt: jest.fn(() => null),
      completeCurrent: jest.fn(),
      clear: jest.fn(() => {
        messages.length = 0;
      }),
      getQueueSize: jest.fn(() => messages.length),
      getCurrentMessageId: jest.fn(() => null),
    },
    VoiceMessage: {},
  };
});

jest.mock('react-native', () => ({
  AccessibilityInfo: {
    announceForAccessibility: jest.fn().mockResolvedValue(undefined),
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    isScreenReaderEnabled: jest.fn().mockResolvedValue(false),
    isReduceMotionEnabled: jest.fn().mockResolvedValue(false),
  },
}));

describe('SpeechController', () => {
  let controller: SpeechController;

  beforeEach(() => {
    controller = new SpeechController();
    (voiceQueue.peek as jest.Mock).mockReturnValue(null);
    (voiceQueue.pop as jest.Mock).mockReturnValue(null);
  });

  afterEach(() => {
    controller.destroy();
    (voiceQueue.clear as jest.Mock).mockClear();
  });

  describe('initial state', () => {
    it('should start in idle state', () => {
      expect(controller.getState()).toBe('idle');
    });
  });

  describe('pause()', () => {
    it('should not transition from idle state', async () => {
      await controller.pause();
      expect(controller.getState()).toBe('idle');
    });
  });

  describe('resume()', () => {
    it('should transition to idle when resuming from paused', async () => {
      await controller.pause();
      await controller.resume();
      expect(controller.getState()).toBe('idle');
    });
  });

  describe('startProcessing()', () => {
    it('should not throw when called multiple times', () => {
      expect(() => controller.startProcessing()).not.toThrow();
      expect(() => controller.startProcessing()).not.toThrow();
    });
  });

  describe('stopProcessing()', () => {
    it('should not throw when called', () => {
      expect(() => controller.stopProcessing()).not.toThrow();
    });
  });

  describe('getPausedMessages()', () => {
    it('should return an array', () => {
      const messages = controller.getPausedMessages();
      expect(Array.isArray(messages)).toBe(true);
    });
  });

  describe('clearPaused()', () => {
    it('should not throw', () => {
      expect(() => controller.clearPaused()).not.toThrow();
    });
  });

  describe('config', () => {
    it('should allow config updates', () => {
      controller.updateConfig({ minGapBetweenMessages: 500 });
      expect(controller.getConfig().minGapBetweenMessages).toBe(500);
    });
  });

  describe('destroy()', () => {
    it('should set state to idle', () => {
      controller.startProcessing();
      controller.destroy();
      expect(controller.getState()).toBe('idle');
    });

    it('should clear paused messages', () => {
      controller.destroy();
      expect(controller.getPausedMessages()).toHaveLength(0);
    });

    it('should be idempotent', () => {
      expect(() => controller.destroy()).not.toThrow();
      expect(() => controller.destroy()).not.toThrow();
    });
  });
});
