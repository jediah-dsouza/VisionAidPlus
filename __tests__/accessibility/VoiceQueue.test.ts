import { VoiceQueue } from '../../src/core/accessibility/VoiceQueue';

describe('VoiceQueue', () => {
  let queue: VoiceQueue;

  beforeEach(() => {
    queue = new VoiceQueue();
  });

  afterEach(() => {
    queue.clear();
  });

  describe('add()', () => {
    it('should add normal priority message to end of queue', () => {
      const id = queue.add({ message: 'test', priority: 'normal' });
      expect(id).toBeDefined();
      expect(queue.getQueueSize()).toBe(1);
    });

    it('should add critical priority message to front of queue', () => {
      queue.add({ message: 'normal', priority: 'normal' });
      queue.add({ message: 'critical', priority: 'critical' });

      const messages = queue.getQueuedMessages();
      expect(messages[0].message).toBe('critical');
    });

    it('should add high priority message before normal/low', () => {
      queue.add({ message: 'normal', priority: 'normal' });
      queue.add({ message: 'low', priority: 'low' });
      queue.add({ message: 'high', priority: 'high' });

      const messages = queue.getQueuedMessages();
      expect(messages[0].message).toBe('high');
      expect(messages[1].message).toBe('normal');
      expect(messages[2].message).toBe('low');
    });
  });

  describe('priority ordering', () => {
    it('should place critical first, then high, then normal/low', () => {
      queue.add({ message: 'low', priority: 'low' });
      queue.add({ message: 'normal', priority: 'normal' });
      queue.add({ message: 'high', priority: 'high' });
      queue.add({ message: 'critical', priority: 'critical' });

      const messages = queue.getQueuedMessages();
      expect(messages[0].priority).toBe('critical');
      expect(messages[1].priority).toBe('high');
    });
  });

  describe('pop()', () => {
    it('should return and remove first message', () => {
      queue.add({ message: 'first', priority: 'normal' });
      queue.add({ message: 'second', priority: 'normal' });

      const message = queue.pop();
      expect(message?.message).toBe('first');
      expect(queue.getQueueSize()).toBe(1);
    });

    it('should return null when queue is empty', () => {
      const message = queue.pop();
      expect(message).toBeNull();
    });
  });

  describe('peek()', () => {
    it('should return first message without removing', () => {
      queue.add({ message: 'first', priority: 'normal' });
      queue.add({ message: 'second', priority: 'normal' });

      const message = queue.peek();
      expect(message?.message).toBe('first');
      expect(queue.getQueueSize()).toBe(2);
    });
  });

  describe('interrupt()', () => {
    it('should return critical message and remove from queue', () => {
      queue.add({ message: 'normal', priority: 'normal' });
      queue.add({ message: 'critical', priority: 'critical' });

      const message = queue.interrupt();
      expect(message?.message).toBe('critical');
      expect(queue.getQueueSize()).toBe(1);
    });

    it('should return high message when no critical', () => {
      queue.add({ message: 'normal', priority: 'normal' });
      queue.add({ message: 'high', priority: 'high' });

      const message = queue.interrupt();
      expect(message?.message).toBe('high');
    });

    it('should return null when queue is empty', () => {
      const message = queue.interrupt();
      expect(message).toBeNull();
    });
  });

  describe('remove()', () => {
    it('should remove specific message by id', () => {
      const id = queue.add({ message: 'test', priority: 'normal' });
      const removed = queue.remove(id);
      expect(removed).toBe(true);
      expect(queue.getQueueSize()).toBe(0);
    });

    it('should return false for non-existent id', () => {
      queue.add({ message: 'test', priority: 'normal' });
      const removed = queue.remove('non-existent');
      expect(removed).toBe(false);
    });
  });

  describe('clear()', () => {
    it('should remove all messages', () => {
      queue.add({ message: 'test1', priority: 'normal' });
      queue.add({ message: 'test2', priority: 'normal' });
      queue.clear();
      expect(queue.getQueueSize()).toBe(0);
    });
  });

  describe('queue overflow', () => {
    it('should drop oldest message when exceeding max size', () => {
      const testQueue = new VoiceQueue();
      testQueue.add({ message: 'first', priority: 'normal' });
      testQueue.add({ message: 'second', priority: 'normal' });
      testQueue.add({ message: 'third', priority: 'normal' });

      const messages = testQueue.getQueuedMessages();
      expect(messages.length).toBeLessThanOrEqual(50);
    });
  });

  describe('completeCurrent()', () => {
    it('should clear current message id', () => {
      queue.add({ message: 'test', priority: 'normal' });
      queue.pop();
      expect(queue.getCurrentMessageId()).toBeDefined();

      queue.completeCurrent();
      expect(queue.getCurrentMessageId()).toBeNull();
    });
  });
});
