import { BackgroundProcessingCoordinator } from '../../src/core/camera/BackgroundProcessingCoordinator';

jest.mock('../../src/core/debug', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

describe('BackgroundProcessingCoordinator', () => {
  let coordinator: BackgroundProcessingCoordinator;

  beforeEach(() => {
    coordinator = new BackgroundProcessingCoordinator();
  });

  afterEach(() => {
    coordinator.destroy();
  });

  it('starts active and not suspended', () => {
    expect(coordinator.getAppState()).toBe('active');
    expect(coordinator.isSuspended()).toBe(false);
  });

  it('handleAppStateChange to background triggers suspend', () => {
    const onSuspend = jest.fn();
    const onResume = jest.fn();
    coordinator.setHandlers(onSuspend, onResume);
    coordinator.handleAppStateChange('background');
    expect(coordinator.isSuspended()).toBe(true);
    expect(onSuspend).toHaveBeenCalled();
  });

  it('handleAppStateChange to active triggers resume', () => {
    const onSuspend = jest.fn();
    const onResume = jest.fn();
    coordinator.setHandlers(onSuspend, onResume);
    coordinator.handleAppStateChange('background');
    coordinator.handleAppStateChange('active');
    expect(coordinator.isSuspended()).toBe(false);
    expect(onResume).toHaveBeenCalled();
  });

  it('does not resume for same state', () => {
    const onSuspend = jest.fn();
    const onResume = jest.fn();
    coordinator.setHandlers(onSuspend, onResume);
    coordinator.handleAppStateChange('active');
    expect(onSuspend).not.toHaveBeenCalled();
    expect(onResume).not.toHaveBeenCalled();
  });

  it('destroy prevents state changes', () => {
    const onSuspend = jest.fn();
    const onResume = jest.fn();
    coordinator.setHandlers(onSuspend, onResume);
    coordinator.destroy();
    coordinator.handleAppStateChange('background');
    expect(onSuspend).not.toHaveBeenCalled();
  });

  it('returns inactive state for inactive transition', () => {
    coordinator.handleAppStateChange('inactive');
    expect(coordinator.getAppState()).toBe('inactive');
  });

  it('returns background state for background transition', () => {
    coordinator.handleAppStateChange('background');
    expect(coordinator.getAppState()).toBe('background');
  });
});
