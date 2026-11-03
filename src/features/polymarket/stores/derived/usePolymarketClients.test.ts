import { RelayClient } from '@polymarket/builder-relayer-client';
import { Wallet } from 'ethers';
import { getAddress } from 'viem';
import { describe, expect, it, vi } from 'vitest';

import { getPolymarketWalletDescriptor, type PolymarketWalletDescriptor } from '@/features/polymarket/stores/polymarketWalletKindStore';
import { createPolymarketWallet, type PolymarketWallet } from '@/features/polymarket/utils/polymarketWallet';
import { loadWallet } from '@/features/wallet/data/loadWallet';

import { getPolymarketWallet, usePolymarketClients } from './usePolymarketClients';

type ReadWalletStore = (
  store: unknown,
  selector: (state: { getData: () => PolymarketWalletDescriptor }) => unknown,
  equality?: unknown
) => unknown;

vi.mock('@polymarket/builder-relayer-client', () => ({ RelayClient: vi.fn() }));

vi.mock('@polymarket/clob-client-v2', () => ({
  Chain: { POLYGON: 137 },
  ClobClient: vi.fn(function () {
    return {
      deriveApiKey: vi.fn().mockResolvedValue({ key: 'key', passphrase: 'passphrase', secret: 'secret' }),
    };
  }),
}));

vi.mock('@storesjs/stores', () => ({
  createDerivedStore: (derive: (read: ReadWalletStore) => unknown) => {
    const state = derive((_store, selector) =>
      selector({
        getData: () => ({
          address: '0x0000000000000000000000000000000000000002',
          kind: 'safe',
          owner: '0x7e5f4552091a69125d5dfcb7b8c2659029395bdf',
          signatureType: 2,
        }),
      })
    );
    return { getState: () => state };
  },
}));

vi.mock('@/features/polymarket/constants', () => ({
  BUILDER_CONFIG: {},
  POLYMARKET_CLOB_PROXY_URL: 'https://clob.test',
  POLYMARKET_RELAYER_PROXY_URL: 'https://relayer.test',
}));

vi.mock('@/features/polymarket/stores/polymarketWalletKindStore', () => ({
  usePolymarketWalletStore: {},
  getPolymarketWalletDescriptor: vi.fn(),
}));

vi.mock('@/features/polymarket/utils/polymarketRelayChain', () => ({
  getPolymarketRelayChain: vi.fn(() => ({})),
}));

vi.mock('@/features/polymarket/utils/polymarketWallet', () => ({
  createPolymarketWallet: vi.fn(),
}));

vi.mock('@/state/wallets/walletsStore', () => ({ useWalletsStore: { getState: () => ({ accountAddress: selectedOwner }) } }));

vi.mock('@/handlers/web3', () => ({ getProvider: vi.fn() }));
vi.mock('@/features/wallet/data/loadWallet', () => ({ loadWallet: vi.fn() }));

const signer = new Wallet('0x0000000000000000000000000000000000000000000000000000000000000001');
let selectedOwner = signer.address;
const wallet: PolymarketWallet = {
  address: '0x0000000000000000000000000000000000000002',
  execute: vi.fn(),
};

const mockCreatePolymarketWallet = vi.mocked(createPolymarketWallet);
const mockLoadWallet = vi.mocked(loadWallet);
const mockRelayClient = vi.mocked(RelayClient);

describe('usePolymarketClients', () => {
  it('reuses the authenticated signer while rejecting other accounts before and after initialization', async () => {
    mockCreatePolymarketWallet.mockResolvedValue(wallet);
    const otherSigner = new Wallet('0x0000000000000000000000000000000000000000000000000000000000000002');
    const { getWallet, getClobClient } = usePolymarketClients.getState();
    if (!getWallet || !getClobClient) throw new Error('Expected active Polymarket clients');

    await expect(getPolymarketWallet('0x0000000000000000000000000000000000000003')).rejects.toThrow('does not match');
    await expect(getWallet(otherSigner)).rejects.toThrow('does not belong');
    expect(mockCreatePolymarketWallet).not.toHaveBeenCalled();

    await expect(getWallet(signer)).resolves.toBe(wallet);
    await getClobClient();

    await expect(getWallet(otherSigner)).rejects.toThrow('does not belong');
    await expect(getWallet(signer)).resolves.toBe(wallet);
    expect(mockCreatePolymarketWallet).toHaveBeenCalledTimes(1);
    expect(mockLoadWallet).not.toHaveBeenCalled();
    expect(mockRelayClient).toHaveBeenCalledWith(expect.any(String), expect.any(Number), signer, expect.any(Object), undefined, {
      chain: {},
    });
  });

  it('keeps the requested account when another wallet is selected during a cold descriptor lookup', async () => {
    const originalSigner = new Wallet('0x0000000000000000000000000000000000000000000000000000000000000002');
    selectedOwner = originalSigner.address;
    const lookup = Promise.withResolvers<PolymarketWalletDescriptor>();
    const address = '0x0000000000000000000000000000000000000003';
    const descriptor = { owner: getAddress(originalSigner.address), address, kind: 'safe', signatureType: 2 } as const;
    vi.mocked(getPolymarketWalletDescriptor).mockReturnValueOnce(lookup.promise);
    vi.spyOn(usePolymarketClients, 'getState').mockReturnValueOnce({ proxyAddress: null, getWallet: null, getClobClient: null });
    mockLoadWallet.mockResolvedValueOnce(originalSigner);
    mockCreatePolymarketWallet.mockResolvedValueOnce({ address, execute: vi.fn() });

    const pending = getPolymarketWallet(address);
    expect(getPolymarketWalletDescriptor).toHaveBeenCalledWith(descriptor.owner);
    selectedOwner = signer.address;
    expect(usePolymarketClients.getState().proxyAddress).toBe(wallet.address);
    lookup.resolve(descriptor);

    await expect(pending).resolves.toMatchObject({ address });
    expect(mockLoadWallet).toHaveBeenLastCalledWith(expect.objectContaining({ address: descriptor.owner }));
    expect(mockCreatePolymarketWallet).toHaveBeenLastCalledWith(descriptor, expect.anything());
  });
});
