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
vi.mock('@/components/images', () => ({ ImgixImage: 'ProxyImage' }));
const url = 'https://token-media.defined.fi/usdc.png';
const render = (icon = url) =>
  FastFallbackCoinIconImage({
    icon,
    shadowColor: '',
    symbol: 'USDC',
    theme: {} as ThemeContextProps,
    children: () => <span>fallback</span>,
  }) as JSX.Element;
beforeEach(() => {
  state.failed = undefined;
});
it('uses the existing image proxy for Solana token URLs', () => {
  expect(render().props.children.type).toBe('ProxyImage');
  expect(render().props.children.props.source).toEqual({ uri: url });
});
it('falls back after a proxy image error and retries a changed URL', () => {
  render().props.children.props.onError();
  expect(render().props.children.type).toBe('View');
  expect(render(url + '?new').props.children.type).toBe('ProxyImage');
});
