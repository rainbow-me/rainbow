import { type ComponentProps, type JSX } from 'react';

import { beforeEach, expect, it, vi } from 'vitest';

import { ChainImage } from './ChainImage';

const state = vi.hoisted(() => ({ isDarkMode: false }));
vi.mock('react', () => ({
  default: {},
  memo: (component: unknown) => component,
  useMemo: (factory: () => unknown) => factory(),
}));
vi.mock('react-native', () => ({ Image: 'LocalImage', View: 'View' }));
vi.mock('@candlefinance/faster-image', () => ({ FasterImageView: 'RemoteImage' }));
vi.mock('@/components/images/ImgixImage', () => ({ DEFAULT_FASTER_IMAGE_CONFIG: {} }));
vi.mock('@/design-system', () => ({ useColorMode: () => state }));
vi.mock('../stores/backendNetworksStore', () => ({
  useBackendNetworksStore: { getState: () => ({ getChainsBadge: () => ({ 8453: 'https://example.com/base.png' }) }) },
}));
function render(props: ComponentProps<typeof ChainImage>): JSX.Element | null {
  return ChainImage(props) as JSX.Element | null;
}

beforeEach(() => {
  state.isDarkMode = false;
});

it('preserves the EVM registry image and visibility rules', () => {
  const row = render({ chainId: 8453 });
  expect(row?.props.children.type).toBe('RemoteImage');
  expect(row?.props.children.props.source.url).toBe('https://example.com/base.png');
  expect(ChainImage({ chainId: 8453, showBadge: false })).toBeNull();
  expect(ChainImage({ chainId: null })).toBeNull();
});

it('uses the same badge layout for bundled icons without an EVM chain ID', () => {
  const row = render({ chainId: null, badgeSource: 7, size: 20, badgeXPosition: -10 });
  expect(row?.props.children.type).toBe('LocalImage');
  expect(row?.props.children.props.source).toBe(7);
  expect(row?.props.children.props.style).toMatchObject({ width: 32, height: 32, left: -6, top: -4 });
  expect(row?.props.style[1]).toMatchObject({ width: 20, height: 20, left: -10 });
  expect(ChainImage({ chainId: null, badgeSource: 7, showBadge: false })).toBeNull();
});

it('preserves dark-mode clipping for both image sources', () => {
  state.isDarkMode = true;
  for (const props of [{ chainId: 8453 }, { chainId: null, badgeSource: 7 }] as const) {
    const row = render(props);
    expect(row?.props.style[1]).toMatchObject({ borderRadius: 10, overflow: 'hidden' });
  }
});
