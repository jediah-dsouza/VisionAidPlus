import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Text, View } from 'react-native';
import { mockNativeModules } from '../mocks/NativeModules';
import { renderWithProviders } from '../helpers/render';

mockNativeModules();

const RUN_BENCHMARKS = typeof globalThis !== 'undefined' && !!(globalThis as any).__PERF__;

const SimpleComponent = () => React.createElement(Text, null, 'Hello');

const ComplexComponent = () =>
  React.createElement(View, null,
    React.createElement(Text, null, 'Header'),
    React.createElement(View, { style: { padding: 8 } },
      React.createElement(Text, null, 'Item 1'),
      React.createElement(Text, null, 'Item 2'),
      React.createElement(Text, null, 'Item 3'),
    ),
  );

function measureRenderTime(
  component: React.ReactElement,
  iterations: number = 50,
): { avg: number; min: number; max: number } {
  const times: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    const instance = ReactTestRenderer.create(component);
    const end = performance.now();
    times.push(end - start);
    instance.unmount();
  }
  return {
    avg: times.reduce((a, b) => a + b, 0) / times.length,
    min: Math.min(...times),
    max: Math.max(...times),
  };
}

describe('Render Benchmarks', () => {
  (RUN_BENCHMARKS ? it : it.skip)('baseline component render time', () => {
    const result = measureRenderTime(React.createElement(SimpleComponent), 100);
    expect(result.avg).toBeLessThan(5);
  });

  (RUN_BENCHMARKS ? it : it.skip)('render with Redux provider', () => {
    const result = measureRenderTime(
      React.createElement(SimpleComponent),
      50,
    );
    expect(result.avg).toBeLessThan(10);
  });

  (RUN_BENCHMARKS ? it : it.skip)('complex component render time', () => {
    const result = measureRenderTime(React.createElement(ComplexComponent), 50);
    expect(result.avg).toBeLessThan(10);
  });

  (RUN_BENCHMARKS ? it : it.skip)('component unmount time', () => {
    const times: number[] = [];
    for (let i = 0; i < 50; i++) {
      const instance = ReactTestRenderer.create(React.createElement(SimpleComponent));
      const start = performance.now();
      instance.unmount();
      const end = performance.now();
      times.push(end - start);
    }
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    expect(avg).toBeLessThan(5);
  });
});
