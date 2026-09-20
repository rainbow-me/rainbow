import React from 'react';
import { ScrollView, View } from 'react-native';

import { SimpleSheet } from './SimpleSheet';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0 }),
}));

jest.mock('@/hooks/useDimensions', () => () => ({ height: 800 }));

jest.mock('./SlackSheet', () => ({
  __esModule: true,
  default: 'SlackSheet',
}));

describe('SimpleSheet', () => {
  it('keeps the scroll container stable when scrolling changes', () => {
    const child = <View />;
    const disabledContent = SimpleSheet({ children: child, scrollEnabled: false }).props.children;
    const enabledContent = SimpleSheet({ children: child, scrollEnabled: true }).props.children;

    expect(disabledContent.type).toBe(ScrollView);
    expect(enabledContent.type).toBe(ScrollView);
    expect(disabledContent.props.scrollEnabled).toBe(false);
    expect(enabledContent.props.scrollEnabled).toBe(true);
    expect(disabledContent.props.children).toBe(child);
    expect(enabledContent.props.children).toBe(child);
  });

  it('disables sheet scrolling when the content owns its layout', () => {
    const sheet = SimpleSheet({ children: <View />, contentContainer: 'view' });

    expect(sheet.props.scrollEnabled).toBe(false);
    expect(sheet.props.children.type).toBe(View);
  });
});
