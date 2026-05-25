/**
 * @format
 */

jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native').View;
  return {
    GestureHandlerRootView: View,
    Swipeable: View,
    State: {},
    PanGestureHandler: View,
    TapGestureHandler: View,
    LongPressGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    NativeViewGestureHandler: View,
    createNativeWrapper: (x: unknown) => x,
    gestureHandlerRootHOC: (x: unknown) => x,
    TouchableOpacity: View,
    TouchableHighlight: View,
    TouchableWithoutFeedback: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    Directions: {},
  };
});

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
}));

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../src/app';

describe('App', () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;

  afterAll(() => {
    if (renderer) {
      renderer.unmount();
    }
  });

  it('should render without crashing', async () => {
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<App />);
    });
    expect(renderer).toBeDefined();
  });
});
