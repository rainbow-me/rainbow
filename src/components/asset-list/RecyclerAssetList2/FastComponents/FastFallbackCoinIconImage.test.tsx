import { type JSX } from 'react';

import { beforeEach, expect, it, vi } from 'vitest';

import { type ThemeContextProps } from '@/theme/ThemeContext';

import { FastFallbackCoinIconImage } from './FastFallbackCoinIconImage';

const state = vi.hoisted(() => ({ failed: undefined as string | undefined }));
vi.mock('react', () => ({
  default: {},
  memo: (fn: unknown) => fn,
  useState: () => [
    state.failed,
    (url: string) => {
      state.failed = url;
    },
  ],
}));
vi.mock('react-native', () => ({ View: 'View', StyleSheet: { create: (styles: unknown) => styles } }));
vi.mock('@candlefinance/faster-image', () => ({ FasterImageView: 'DirectImage' }));
vi.mock('@/components/images', () => ({ ImgixImage: 'ProxyImage' }));
vi.mock('@/components/images/ImgixImage', () => ({ DEFAULT_FASTER_IMAGE_CONFIG: { cachePolicy: 'discWithCacheControl' } }));
const url = 'https://token-media.defined.fi/usdc.png';
const render = (direct = false, icon = url) =>
  FastFallbackCoinIconImage({
    icon,
    direct,
    shadowColor: '',
    symbol: 'USDC',
    theme: {} as ThemeContextProps,
    children: () => <span>fallback</span>,
  }) as JSX.Element;
beforeEach(() => {
  state.failed = undefined;
});
it('preserves the default EVM image proxy and uses direct loading only when requested', () => {
  expect(render().props.children.type).toBe('ProxyImage');
  expect(render(true).props.children.props.source).toMatchObject({ url, cachePolicy: 'discWithCacheControl' });
});
it('falls back after a direct image error and retries a changed URL', () => {
  render(true).props.children.props.onError();
  expect(render(true).props.children.type).toBe('View');
  expect(render(true, url + '?new').props.children.type).toBe('DirectImage');
});
