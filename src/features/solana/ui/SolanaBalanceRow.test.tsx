import { beforeEach, expect, it, vi } from 'vitest';

import { type SolanaBalance } from '@/features/solana/core/balances';

import { SolanaBalanceRow } from './SolanaBalanceRow';

const state = vi.hoisted(() => ({ failedIconUrl: undefined as string | undefined, balances: [] as SolanaBalance[] }));
vi.mock('react', () => ({
  default: {},
  memo: (component: unknown) => component,
  useState: () => [
    state.failedIconUrl,
    (url: string) => {
      state.failedIconUrl = url;
    },
  ],
}));
vi.mock('@/features/solana/data/solanaBalancesStore', () => ({
  useSolanaWalletBalances: (selector: (value: unknown) => unknown) => selector({ data: { balances: state.balances }, currency: 'USD' }),
  selectSolanaBalance: (value: { data: { balances: SolanaBalance[] } }, uniqueId: string) =>
    value.data.balances.find(balance => balance.assetId === uniqueId),
}));
vi.mock('@/features/network/components/ChainImage', () => ({ ChainImage: 'ChainImage' }));
vi.mock('@/features/solana/constants/networkAssets', () => ({ SOLANA_NETWORK_BADGE: 1 }));
vi.mock('@candlefinance/faster-image', () => ({ FasterImageView: 'Image' }));
vi.mock('@/components/images/ImgixImage', () => ({ DEFAULT_FASTER_IMAGE_CONFIG: { cachePolicy: 'discWithCacheControl' } }));
vi.mock('@/design-system', () => ({ Box: 'Box', Text: 'Text' }));
vi.mock('@/theme/ThemeContext', () => ({ useTheme: () => ({ colors: { green: 'green', blueGreyDark50: 'gray' } }) }));
vi.mock('@/helpers/utilities', () => ({ toSignificantDigits: ({ value }: { value: number }) => value.toFixed(2) }));
vi.mock('@/features/currency/utils/nativeDisplay', () => ({ convertAmountToNativeDisplay: (value: string) => `$${value}` }));

type Element = { type: unknown; props: { children?: unknown; [key: string]: unknown } };
function findImage(node: unknown): Element | undefined {
  if (Array.isArray(node)) return node.map(findImage).find(Boolean);
  if (!node || typeof node !== 'object' || !('props' in node)) return undefined;
  const element = node as Element;
  return element.type === 'Image' ? element : findImage(element.props.children);
}
const balance: SolanaBalance = {
  assetId: 'bonk',
  name: 'Bonk',
  symbol: 'BONK',
  amount: '415600',
  rawUnits: false,
  value: '0.98',
  iconUrl: 'https://token-media.defined.fi/bonk.png',
  relativeChange24h: 0.58,
};
function render(value = balance) {
  state.balances = [value];
  return SolanaBalanceRow({ uniqueId: value.assetId });
}
beforeEach(() => {
  state.failedIconUrl = undefined;
});

it('loads the backend icon directly without passing through the EVM image proxy', () => {
  expect(findImage(render())?.props.source).toMatchObject({ url: balance.iconUrl, cachePolicy: 'discWithCacheControl' });
});
it('keeps the letter fallback on failure and tries a replacement URL', () => {
  const image = findImage(render());
  if (!image) throw new Error('Missing icon');
  (image.props.onError as () => void)();
  expect(findImage(render())).toBeUndefined();
  expect(findImage(render({ ...balance, iconUrl: 'https://token-media.defined.fi/bonk-new.png' }))).toBeDefined();
});
it('keeps rows renderable when icon and price-change metadata are absent', () => {
  expect(findImage(render({ ...balance, iconUrl: undefined, relativeChange24h: undefined }))).toBeUndefined();
});

it('renders nothing when the selected account no longer contains the asset', () => {
  state.balances = [];
  expect(SolanaBalanceRow({ uniqueId: balance.assetId })).toBeNull();
});
it('looks up the new asset when the recycler reuses a row', () => {
  const other = { ...balance, assetId: 'usdc', iconUrl: 'https://token-media.defined.fi/usdc.png' };
  state.balances = [balance, other];
  expect(findImage(SolanaBalanceRow({ uniqueId: balance.assetId }))?.props.source).toMatchObject({ url: balance.iconUrl });
  expect(findImage(SolanaBalanceRow({ uniqueId: other.assetId }))?.props.source).toMatchObject({ url: other.iconUrl });
});
