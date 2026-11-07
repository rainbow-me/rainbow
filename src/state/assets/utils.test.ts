import { describe, expect, it } from 'vitest';

import { ChainId } from '@/features/network/types/backendNetworks';

import { createUserAssetsStore } from './createUserAssetsStore';
import { type UserAsset } from './types';
import { setUserAssets } from './utils';

const ADDRESS = '0x0000000000000000000000000000000000000001';

describe('setUserAssets', () => {
  it('accepts an asset whose networks map the API omitted', () => {
    const userAsset: UserAsset = {
      asset: {
        address: '0x00000000000000000000000000000000000000aa',
        chainId: ChainId.base,
        name: 'Token',
        symbol: 'TKN',
        decimals: 18,
        type: 'erc20',
        network: 'base',
        verified: false,
        transferable: true,
        colors: { primary: '#000000' },
        price: { value: 1, changedAt: 0, relativeChange24h: 0 },
        bridging: { bridgeable: false, networks: {} },
      },
      quantity: '1000000000000000000',
      value: '1',
      smallBalance: false,
      updatedAt: '0',
    };
    const state = createUserAssetsStore(ADDRESS).getState();

    const next = setUserAssets({ state, userAssets: [userAsset] });

    const parsed = [...next.userAssets.values()][0];
    expect(parsed.networks).toEqual({});
    expect(parsed.mainnetAddress).toBeUndefined();
  });
});
