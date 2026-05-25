import { mockNativeModules } from '../mocks/NativeModules';
import { MockRegistry } from '../MockRegistry';
import { createMockNavigation } from '../mocks/NavigationTestHarness';

mockNativeModules();

beforeAll(() => {
  MockRegistry.resetAll();
});

describe('Navigation Routing Integration', () => {
  it('createMockNavigation provides jest stubs', () => {
    const nav = createMockNavigation();
    nav.navigate('Test', { id: 1 });

    expect(nav.navigate).toHaveBeenCalledWith('Test', { id: 1 });
  });

  it('goBack is callable', () => {
    const nav = createMockNavigation();
    nav.goBack();

    expect(nav.goBack).toHaveBeenCalled();
  });

  it('reset replaces navigation stack', () => {
    const nav = createMockNavigation();
    nav.reset({ index: 0, routes: [{ name: 'Home' }] });

    expect(nav.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  });

  it('dispatch is callable with action', () => {
    const nav = createMockNavigation();
    nav.dispatch({ type: 'NAVIGATE', payload: { name: 'Settings' } });

    expect(nav.dispatch).toHaveBeenCalledWith({
      type: 'NAVIGATE',
      payload: { name: 'Settings' },
    });
  });

  it('isFocused returns true by default', () => {
    const nav = createMockNavigation();
    expect(nav.isFocused()).toBe(true);
  });

  it('addListener returns cleanup function', () => {
    const nav = createMockNavigation();
    const cleanup = (nav.addListener as any)('focus', jest.fn());
    expect(typeof cleanup).toBe('function');
  });
});
