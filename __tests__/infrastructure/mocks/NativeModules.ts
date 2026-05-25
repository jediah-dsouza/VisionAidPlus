export function mockNativeModules(): void {
  jest.mock('react-native-gesture-handler', () => ({
    GestureHandlerRootView: 'GestureHandlerRootView',
    RNGestureHandlerModule: {
      createGestureHandler: jest.fn(),
      attachGestureHandler: jest.fn(),
      updateGestureHandler: jest.fn(),
      dropGestureHandler: jest.fn(),
      install: jest.fn(),
      flushOperations: jest.fn(),
      DIRECTION_ALL: 1,
      STATE_UNDETERMINED: 0,
      STATE_BEGAN: 1,
      STATE_ACTIVE: 2,
      STATE_END: 3,
      STATE_CANCELLED: 4,
      STATE_FAILED: 5,
    },
    PanGestureHandler: 'PanGestureHandler',
    TapGestureHandler: 'TapGestureHandler',
    LongPressGestureHandler: 'LongPressGestureHandler',
    PinchGestureHandler: 'PinchGestureHandler',
    RotationGestureHandler: 'RotationGestureHandler',
    FlingGestureHandler: 'FlingGestureHandler',
    NativeViewGestureHandler: 'NativeViewGestureHandler',
    ScrollView: 'ScrollView',
    Switch: 'Switch',
    TextInput: 'TextInput',
    Toolbar: 'Toolbar',
    DrawerLayout: 'DrawerLayout',
    State: {
      UNDETERMINED: 0,
      BEGAN: 1,
      ACTIVE: 2,
      END: 3,
      CANCELLED: 4,
      FAILED: 5,
    },
  }));

  jest.mock('@react-native-async-storage/async-storage', () => ({
    default: {
      getItem: jest.fn(() => Promise.resolve(null)),
      setItem: jest.fn(() => Promise.resolve()),
      removeItem: jest.fn(() => Promise.resolve()),
      clear: jest.fn(() => Promise.resolve()),
      getAllKeys: jest.fn(() => Promise.resolve([])),
      multiGet: jest.fn(() => Promise.resolve([])),
      multiSet: jest.fn(() => Promise.resolve()),
      multiRemove: jest.fn(() => Promise.resolve()),
    },
  }));

  jest.mock('react-native-reanimated', () => ({
    default: {
      createAnimatedComponent: (comp: unknown) => comp,
      spring: jest.fn(),
      timing: jest.fn(),
      Value: jest.fn(),
      View: 'View',
      Text: 'Text',
      Image: 'Image',
      ScrollView: 'ScrollView',
      FlatList: 'FlatList',
    },
  }));
}

export const createInMemoryStorage = () => {
  const store = new Map<string, string>();
  return {
    getItem: jest.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
    setItem: jest.fn((key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve();
    }),
    removeItem: jest.fn((key: string) => {
      store.delete(key);
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      store.clear();
      return Promise.resolve();
    }),
    getAllKeys: jest.fn(() => Promise.resolve(Array.from(store.keys()))),
    multiGet: jest.fn((keys: string[]) =>
      Promise.resolve(keys.map(k => [k, store.get(k) ?? null])),
    ),
    multiSet: jest.fn((pairs: [string, string][]) => {
      pairs.forEach(([k, v]) => store.set(k, v));
      return Promise.resolve();
    }),
    multiRemove: jest.fn((keys: string[]) => {
      keys.forEach(k => store.delete(k));
      return Promise.resolve();
    }),
    _store: store,
  };
};
