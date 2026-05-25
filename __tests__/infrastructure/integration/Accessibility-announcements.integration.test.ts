import React from 'react';
import { Text } from 'react-native';
import { renderWithProviders } from '../helpers/render';
import { getTextContent } from '../helpers/accessibility';

describe('Accessibility Helpers Integration', () => {
  it('getTextContent extracts text from flat tree', () => {
    const tree = { type: 'Text', props: {}, children: ['Hello World'] };
    expect(getTextContent(tree)).toBe('Hello World');
  });

  it('getTextContent extracts text from nested tree', () => {
    const tree = {
      type: 'View',
      props: {},
      children: [{ type: 'Text', props: {}, children: ['Nested Content'] }],
    };
    expect(getTextContent(tree)).toBe('Nested Content');
  });

  it('getTextContent extracts text from tree with multiple children', () => {
    const tree = {
      type: 'View',
      props: {},
      children: [
        { type: 'Text', props: {}, children: ['Hello '] },
        { type: 'Text', props: {}, children: ['World'] },
      ],
    };
    expect(getTextContent(tree)).toBe('Hello World');
  });

  it('renderWithProviders creates store and unmounts cleanly', () => {
    const { store, unmount } = renderWithProviders(
      React.createElement(Text, null, 'Test'),
    );
    expect(store).toBeDefined();
    expect(store.getState()).toBeDefined();
    expect(() => unmount()).not.toThrow();
  });

  it('renderWithProviders renders text content', () => {
    const { root, unmount } = renderWithProviders(
      React.createElement(Text, { testID: 'greeting' }, 'Hello World'),
    );
    const json = root.toJSON();
    expect(json).not.toBeNull();
    if (json && !Array.isArray(json)) {
      expect(json.type).toBe('Text');
    }
    unmount();
  });
});
