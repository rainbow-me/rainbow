import { SOLANA_LOCAL_CHAIN_ID } from '@/features/solana/constants';

import { type BackendNetworksState } from './backendNetworksStore';

/**
 * What the app-local Solana descriptor is and is not allowed to reach.
 *
 * The record selectors have to describe Solana, or a row has no name, label, badge
 * or native asset. The chain selectors must not, because `backendChains` is what
 * viem providers are built from and `transformBackendNetworkToChain` gives every
 * entry it sees an EVM JSON-RPC endpoint. The two sets are asserted separately, and
 * a fresh module registry per case because the selectors memoize on the fetched
 * array's identity, which a flag flip does not change.
 */

let mockSolanaBalancesEnabled = false;

jest.mock('@/features/config/stores/experimentalConfigStore', () => ({
  getExperimentalFlag: () => mockSolanaBalancesEnabled,
}));

function loadStoreWithFlag(enabled: boolean): BackendNetworksState {
  mockSolanaBalancesEnabled = enabled;
  jest.resetModules();
  // eslint-disable-next-line @typescript-eslint/no-require-imports, import/no-commonjs
  const { useBackendNetworksStore } = require('./backendNetworksStore') as typeof import('./backendNetworksStore');
  return useBackendNetworksStore.getState();
}

/** Every selector that answers "what is this chain called and what does it look like". */
const RECORD_SELECTORS = ['getChainsName', 'getChainsLabel', 'getChainsBadge', 'getChainsNativeAsset'] as const;

/** Every selector derived from `backendChains`, which builds viem providers. */
const CHAIN_ID_SELECTORS = [
  'getSupportedChainIds',
  'getSortedSupportedChainIds',
  'getSupportedMainnetChainIds',
] as const satisfies readonly (keyof BackendNetworksState)[];

/** Selectors gated on a backend service, none of which serves Solana. */
const SERVICE_SELECTORS = [
  'getMeteorologySupportedChainIds',
  'getSwapSupportedChainIds',
  'getSupportedAssetsChainIds',
  'getSupportedPositionsChainIds',
  'getTokenSearchSupportedChainIds',
  'getNftSupportedChainIds',
  'getTransactionsSupportedChainIds',
  'getApprovalsSupportedChainIds',
  'getNeedsL1SecurityFeeChains',
  'getSponsorshipEligibleChainIds',
] as const satisfies readonly (keyof BackendNetworksState)[];

describe('backendNetworksStore with the Solana balances flag on', () => {
  it('describes Solana in every record selector a balance row reads', () => {
    const state = loadStoreWithFlag(true);

    for (const selector of RECORD_SELECTORS) {
      expect(state[selector]()[SOLANA_LOCAL_CHAIN_ID]).toBeDefined();
    }

    expect(state.getChainsName()[SOLANA_LOCAL_CHAIN_ID]).toBe('solana');
    expect(state.getChainsLabel()[SOLANA_LOCAL_CHAIN_ID]).toBe('Solana');
    expect(state.getChainsBadge()[SOLANA_LOCAL_CHAIN_ID]).toMatch(/^https:\/\//);
    expect(state.getChainsNativeAsset()[SOLANA_LOCAL_CHAIN_ID]).toMatchObject({ decimals: 9, symbol: 'SOL' });
    expect(state.getChainsIdByName().solana).toBe(SOLANA_LOCAL_CHAIN_ID);
  });

  it('carries the real SOL mint as the native asset address, which is what makes a SOL row the chain currency', () => {
    // `isNativeAsset` compares an asset's address to this field, and its result decides
    // which row the send and gas flows treat as the chain's own currency. A hex
    // placeholder here would typecheck and silently make no Solana row native.
    expect(loadStoreWithFlag(true).getChainsNativeAsset()[SOLANA_LOCAL_CHAIN_ID].address).toBe(
      'So11111111111111111111111111111111111111111'
    );
  });

  it('keeps Solana out of every chain list a viem provider is built from', () => {
    const state = loadStoreWithFlag(true);

    for (const selector of CHAIN_ID_SELECTORS) {
      expect(state[selector]()).not.toContain(SOLANA_LOCAL_CHAIN_ID);
    }
    expect(state.getSupportedChains().map(chain => chain.id)).not.toContain(SOLANA_LOCAL_CHAIN_ID);
    expect(state.getDefaultChains()[SOLANA_LOCAL_CHAIN_ID]).toBeUndefined();
  });

  it('claims no backend service for Solana', () => {
    const state = loadStoreWithFlag(true);

    for (const selector of SERVICE_SELECTORS) {
      expect(state[selector]()).not.toContain(SOLANA_LOCAL_CHAIN_ID);
    }
  });
});

describe('backendNetworksStore with the Solana balances flag off', () => {
  it('describes no Solana chain anywhere', () => {
    const state = loadStoreWithFlag(false);

    for (const selector of RECORD_SELECTORS) {
      expect(state[selector]()[SOLANA_LOCAL_CHAIN_ID]).toBeUndefined();
    }
    expect(state.getChainsIdByName().solana).toBeUndefined();
    expect(state.getSupportedChainIds()).not.toContain(SOLANA_LOCAL_CHAIN_ID);
  });

  it('still describes mainnet, so the gating is additive rather than a switch', () => {
    const state = loadStoreWithFlag(false);

    expect(state.getChainsName()[1]).toBe('mainnet');
    expect(state.getSupportedChainIds()).toContain(1);
  });
});
