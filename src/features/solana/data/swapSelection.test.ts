import { beforeEach, expect, it, vi } from 'vitest';

import { SWAP_ASSETS } from '@/features/solana/core/swap';

import { selectSolanaSwap, useSolanaSwapSelection } from './swapSelection';

const state = vi.hoisted(() => ({ address: null as string | null, walletId: 'wallet-1', evm: '0xABC' }));
vi.mock('./solanaBalancesStore', () => ({ useSolanaBalancesAddress: { getState: () => state.address } }));
vi.mock('@/state/wallets/walletsStore', () => ({
  useWalletsStore: { getState: () => ({ selected: { id: state.walletId }, accountAddress: state.evm }) },
}));
beforeEach(() => {
  useSolanaSwapSelection.setState({ selection: null });
  state.address = null;
  state.walletId = 'wallet-1';
});
it('cannot opt into the Solana controller when the flag/account gate is closed', () => {
  selectSolanaSwap({ inputAsset: SWAP_ASSETS['base-eth'], outputAsset: SWAP_ASSETS['bonk'], amount: '0.001' });
  expect(useSolanaSwapSelection.getState().selection).toBeNull();
});
it('binds an enabled selection to both its Solana address and current EVM wallet identity', () => {
  state.address = 'solana-address';
  selectSolanaSwap({ inputAsset: SWAP_ASSETS['base-eth'], outputAsset: SWAP_ASSETS['bonk'], amount: '0.001' });
  expect(useSolanaSwapSelection.getState().selection).toEqual({
    address: state.address,
    accountKey: 'wallet-1:0xabc',
    inputAsset: SWAP_ASSETS['base-eth'],
    outputAsset: SWAP_ASSETS['bonk'],
    amount: '0.001',
  });
  state.walletId = 'wallet-2';
  selectSolanaSwap({ inputAsset: SWAP_ASSETS['sol'], outputAsset: SWAP_ASSETS['usdc'], amount: '1' });
  expect(useSolanaSwapSelection.getState().selection?.accountKey).toBe('wallet-2:0xabc');
});
