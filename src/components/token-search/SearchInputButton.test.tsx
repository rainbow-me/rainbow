import { expect, it, vi } from 'vitest';

import { SearchInputButton } from './SearchInputButton';

const mocks = vi.hoisted(() => ({ clipboard: vi.fn() }));
vi.mock('react', async original => ({ ...(await original<typeof import('react')>()), useCallback: (fn: unknown) => fn }));
vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
vi.mock('./constants', () => ({ TOKEN_SEARCH_CONTROL_ITEM_HEIGHT: 36 }));
vi.mock('@react-native-clipboard/clipboard', () => ({ default: { getString: mocks.clipboard } }));
vi.mock('react-native-turbo-haptics', () => ({ triggerHaptics: vi.fn() }));
vi.mock('react-native-reanimated', () => ({
  default: { View: 'View' },
  runOnJS: (fn: unknown) => fn,
  useDerivedValue: (fn: () => unknown) => ({ value: fn() }),
  useAnimatedStyle: (fn: () => unknown) => fn(),
  withTiming: (value: unknown) => value,
}));
vi.mock('@/components/animations/animationConfigs', () => ({ TIMING_CONFIGS: { tabPressConfig: {} } }));
vi.mock('@/components/buttons/GestureHandlerButton', () => ({ GestureHandlerButton: 'Button' }));
vi.mock('@/design-system', () => ({ AnimatedText: 'Text', Box: 'Box' }));
vi.mock('@/hooks/useClipboard', () => ({ default: () => ({ hasClipboardData: true }) }));
vi.mock('@/languages', () => ({ t: (key: string) => key, l: { button: { cancel: 'Cancel', close: 'Close', paste: 'Paste' } } }));

it.each([undefined, 44])('preserves the EVM default and supports a full Solana mint with paste length %s', async maxPasteLength => {
  const mint = 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN';
  mocks.clipboard.mockResolvedValue(` ${mint} `);
  const onPasteSearchQuery = vi.fn();
  const props = {
    enablePaste: true,
    maxPasteLength,
    showButtonWhenNoAsset: true,
    pastedSearchInputValue: { value: '' },
    isSearchFocused: { value: false },
    isTokenListFocused: { value: true },
    isAssetSelected: { value: false },
    animatedButtonStyles: { buttonStyle: {}, buttonWrapperStyle: {} },
    onPasteSearchQuery,
    onCancelOrClosePressWorklet: vi.fn(),
    searchInputRef: { current: null },
  } as unknown as Parameters<typeof SearchInputButton>[0];
  const tree = SearchInputButton(props);
  tree.props.children.props.onPressWorklet();
  await vi.waitFor(() => expect(onPasteSearchQuery).toHaveBeenCalledWith(maxPasteLength ? mint : mint.slice(0, 42)));
});
