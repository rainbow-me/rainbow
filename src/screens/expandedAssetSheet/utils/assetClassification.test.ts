import { describe, expect, test } from 'vitest';

import { ChainId } from '@/features/network/types/backendNetworks';
import { AssetClass } from '@/graphql/__generated__/metadata';

import { getAssetClassification, type AssetClassification, type AssetClassificationInput } from './assetClassification';

const NVDA_ICON = 'https://example.com/nvda.png';
const ROBINHOOD_ICON = 'https://example.com/robinhood.png';

const nvidia = { name: 'NVIDIA Corporation', ticker: 'NVDA', iconUrl: NVDA_ICON };
const stock: AssetClassificationInput = {
  assetClass: AssetClass.TokenizedEquity,
  issuer: { name: 'Robinhood', iconUrl: ROBINHOOD_ICON },
  underlyingAsset: nvidia,
};
const stockToken = { name: 'NVIDIA • Robinhood Token', symbol: 'NVDA', chainId: 4663 as ChainId, chainLabel: 'Robinhood Chain' };

const stablecoin = (currency: string | null): AssetClassificationInput => ({
  assetClass: AssetClass.Stablecoin,
  issuer: { name: 'Circle', iconUrl: '' },
  underlyingAsset: currency === null ? null : { name: currency, ticker: 'X', iconUrl: '' },
});
const stablecoinToken = { name: 'USD Coin', symbol: 'USDC', chainId: ChainId.mainnet, chainLabel: 'Ethereum' };

const rowKeys = (result: AssetClassification | undefined) => result?.rows.map(row => row.key);
const infoString = (result: AssetClassification | undefined) => result?.infoText?.map(part => part.text).join('');

describe('getAssetClassification', () => {
  test.each([
    ['asset null', null],
    ['asset undefined', undefined],
    ['crypto', { assetClass: AssetClass.Crypto, issuer: null, underlyingAsset: null }],
    ['unknown class', { assetClass: 'COMMODITY' as AssetClass }],
  ])('%s is not classified', (_, asset) => {
    expect(getAssetClassification(asset, stockToken)).toBeUndefined();
  });

  test('a tokenized stock with every field', () => {
    const result = getAssetClassification(stock, stockToken);

    expect(result?.label).toBe('Stock');
    expect(result?.rows).toEqual([
      { key: 'asset_type', title: 'Asset Type', value: 'Tokenized Stock', icon: expect.any(String) },
      {
        key: 'underlying_asset',
        title: 'Underlying Asset',
        value: 'NVIDIA Corporation',
        icon: expect.any(String),
        valueIcon: { type: 'image', url: NVDA_ICON },
      },
      { key: 'issuer', title: 'Issuer', value: 'Robinhood', icon: expect.any(String), valueIcon: { type: 'image', url: ROBINHOOD_ICON } },
      { key: 'onchain_ticker', title: 'Onchain Ticker', value: 'NVDA', icon: expect.any(String) },
      { key: 'offchain_ticker', title: 'Offchain Ticker', value: 'NVDA', icon: expect.any(String) },
      {
        key: 'blockchain',
        title: 'Blockchain',
        value: 'Robinhood Chain',
        icon: expect.any(String),
        valueIcon: { type: 'chain', chainId: 4663 },
      },
    ]);
    expect(result?.infoText).toEqual([
      { text: 'NVIDIA • Robinhood Token', emphasized: true },
      { text: ' is a token that tracks the price of ', emphasized: false },
      { text: 'NVIDIA Corporation', emphasized: true },
      { text: " stock.\n\nIt's issued by ", emphasized: false },
      { text: 'Robinhood', emphasized: true },
      { text: ' on ', emphasized: false },
      { text: 'Robinhood Chain', emphasized: true },
      { text: '. You can buy, sell and hold it in your wallet like any other token.', emphasized: false },
    ]);
  });

  test.each<[string, Partial<AssetClassificationInput>, Partial<typeof stockToken>, string[]]>([
    ['underlying asset null', { underlyingAsset: null }, {}, ['underlying_asset', 'offchain_ticker']],
    ['underlying name empty', { underlyingAsset: { ...nvidia, name: '' } }, {}, ['underlying_asset']],
    ['issuer null', { issuer: null }, {}, ['issuer']],
    ['issuer name empty', { issuer: { name: '', iconUrl: ROBINHOOD_ICON } }, {}, ['issuer']],
    ['chain label missing', {}, { chainLabel: undefined }, ['blockchain']],
    ['token name empty', {}, { name: '' }, []],
  ])('a stock with %s keeps its label but hides the ⓘ', (_, assetOverride, tokenOverride, hiddenRows) => {
    const full = rowKeys(getAssetClassification(stock, stockToken));
    const result = getAssetClassification({ ...stock, ...assetOverride }, { ...stockToken, ...tokenOverride });

    expect(result?.label).toBe('Stock');
    expect(result?.infoText).toBeUndefined();
    expect(rowKeys(result)).toEqual(full?.filter(key => !hiddenRows.includes(key)));
  });

  test.each<[string, Partial<AssetClassificationInput>, Partial<typeof stockToken>, string]>([
    ['symbol empty', {}, { symbol: '' }, 'onchain_ticker'],
    ['underlying ticker empty', { underlyingAsset: { ...nvidia, ticker: '' } }, {}, 'offchain_ticker'],
  ])('a stock with %s hides only that row', (_, assetOverride, tokenOverride, hiddenRow) => {
    const result = getAssetClassification({ ...stock, ...assetOverride }, { ...stockToken, ...tokenOverride });

    expect(rowKeys(result)).not.toContain(hiddenRow);
    expect(rowKeys(result)).toHaveLength(5);
    expect(result?.infoText).toBeDefined();
  });

  test('an empty icon url shows the name without an icon', () => {
    const result = getAssetClassification(
      { ...stock, issuer: { name: 'Robinhood', iconUrl: '' }, underlyingAsset: { ...nvidia, iconUrl: '' } },
      stockToken
    );

    expect(result?.rows.find(row => row.key === 'issuer')).toMatchObject({ value: 'Robinhood', valueIcon: undefined });
    expect(result?.rows.find(row => row.key === 'underlying_asset')).toMatchObject({ value: 'NVIDIA Corporation', valueIcon: undefined });
  });

  test.each([
    [
      'US Dollar',
      'A stablecoin is a token designed to hold a steady value. USD Coin is designed to stay at 1 US dollar and is issued by Circle.',
    ],
    ['Euro', 'A stablecoin is a token designed to hold a steady value. USD Coin is designed to stay at 1 euro and is issued by Circle.'],
    [
      'British Pound',
      'A stablecoin is a token designed to hold a steady value. USD Coin is designed to stay at 1 British pound and is issued by Circle.',
    ],
  ])('a stablecoin pegged to %s', (currency, info) => {
    const result = getAssetClassification(stablecoin(currency), stablecoinToken);

    expect(result?.label).toBe('Stablecoin');
    expect(result?.rows.map(({ key, value }) => [key, value])).toEqual([
      ['asset_type', 'Stablecoin'],
      ['issuer', 'Circle'],
    ]);
    expect(infoString(result)).toBe(info);
  });

  test.each<[string, AssetClassificationInput, Partial<typeof stablecoinToken>, string[]]>([
    ['no issuer', { ...stablecoin('US Dollar'), issuer: null }, {}, ['asset_type']],
    ['an empty issuer name', { ...stablecoin('US Dollar'), issuer: { name: '', iconUrl: '' } }, {}, ['asset_type']],
    ['an empty token name', stablecoin('US Dollar'), { name: '' }, ['asset_type', 'issuer']],
  ])('a stablecoin with %s hides the ⓘ', (_, asset, tokenOverride, rows) => {
    const result = getAssetClassification(asset, { ...stablecoinToken, ...tokenOverride });

    expect(rowKeys(result)).toEqual(rows);
    expect(result?.infoText).toBeUndefined();
  });

  test('a stablecoin without an underlying asset keeps its issuer row but hides the ⓘ', () => {
    const result = getAssetClassification(stablecoin(null), stablecoinToken);

    expect(rowKeys(result)).toEqual(['asset_type', 'issuer']);
    expect(result?.infoText).toBeUndefined();
  });

  test('no output ever shows a placeholder', () => {
    const outputs = [
      getAssetClassification(stock, stockToken),
      getAssetClassification({ ...stock, issuer: null, underlyingAsset: null }, { ...stockToken, chainLabel: undefined }),
      getAssetClassification(stablecoin('US Dollar'), stablecoinToken),
      getAssetClassification(stablecoin(null), { ...stablecoinToken, name: '' }),
    ];

    for (const output of outputs) {
      const strings = [output?.label, ...(output?.rows.flatMap(row => [row.title, row.value]) ?? []), infoString(output)];
      for (const value of strings) expect(value ?? '').not.toMatch(/[[\]%{}]|undefined|null/);
    }
  });
});
