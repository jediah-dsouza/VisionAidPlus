import { CameraLifecycleManager } from '../../src/core/camera/CameraLifecycleManager';
import type { CameraDeviceInfo } from '../../src/core/camera/types';

jest.mock('../../src/core/debug', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../src/core/events/EventBus', () => ({
  eventBus: {
    subscribe: jest.fn(() => jest.fn()),
    publish: jest.fn(),
  },
  EVENTS: {},
}));

jest.mock('../../src/core/events/AI_EVENTS', () => ({
  AI_EVENTS: {
    SESSION_STATE_CHANGE: 'ai:sessionStateChange',
    PIPELINE_ERROR: 'ai:pipelineError',
  },
}));

const mockDevice: CameraDeviceInfo = {
  id: 'camera_1',
  position: 'back',
  hasFlash: true,
  hasTorch: false,
  supportsDepth: false,
  supportsFocus: true,
  resolutions: [{ width: 1920, height: 1080 }],
  physicalDevices: ['back_wide'],
};

describe('CameraLifecycleManager', () => {
  let manager: CameraLifecycleManager;

  beforeEach(() => {
    jest.clearAllMocks();
    manager = new CameraLifecycleManager();
  });

  afterEach(() => {
    manager.destroy();
  });

  it('starts in idle state', () => {
    expect(manager.getState()).toBe('idle');
  });

  it('requestPermission transitions to requesting', async () => {
    await manager.requestPermission();
    expect(manager.getState()).toBe('requesting');
  });

  it('prepare transitions to preparing', async () => {
    await manager.prepare(mockDevice);
    expect(manager.getState()).toBe('preparing');
  });

  it('start transitions to active', async () => {
    await manager.prepare(mockDevice);
    await manager.start();
    expect(manager.getState()).toBe('active');
  });

  it('stop transitions to idle', async () => {
    await manager.prepare(mockDevice);
    await manager.start();
    await manager.stop();
    expect(manager.getState()).toBe('idle');
  });

  it('suspend transitions to suspended from active', async () => {
    await manager.prepare(mockDevice);
    await manager.start();
    manager.suspend();
    expect(manager.getState()).toBe('suspended');
  });

  it('resume goes back to active from suspended', async () => {
    await manager.prepare(mockDevice);
    await manager.start();
    manager.suspend();
    manager.resume();
    expect(manager.getState()).toBe('active');
  });

  it('setError transitions to error', () => {
    manager.setError('Test error');
    expect(manager.getState()).toBe('error');
  });

  it('destroy transitions to idle', async () => {
    await manager.prepare(mockDevice);
    await manager.start();
    manager.destroy();
    expect(manager.getState()).toBe('idle');
  });
});
