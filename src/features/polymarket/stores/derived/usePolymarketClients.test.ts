import { RelayClient } from '@polymarket/builder-relayer-client';
import { ClobClient } from '@polymarket/clob-client-v2';
import { Wallet } from 'ethers';
import { getAddress } from 'viem';
import { describe, expect, it, vi } from 'vitest';

import { POLYMARKET_BUILDER_CODE } from '@/features/polymarket/constants';
import {
  getPolymarketWalletDescriptor,
  usePolymarketWalletStore,
  type PolymarketWalletDescriptor,
} from '@/features/polymarket/stores/polymarketWalletKindStore';
import { createPolymarketWallet, type PolymarketWallet } from '@/features/polymarket/utils/polymarketWallet';
import { loadWallet } from '@/features/wallet/data/loadWallet';

import { getPolymarketWallet, usePolymarketClients } from './usePolymarketClients';

vi.mock('@polymarket/builder-relayer-client', () => ({ RelayClient: vi.fn() }));

vi.mock('@polymarket/clob-client-v2', () => ({
  Chain: { POLYGON: 137 },
  ClobClient: vi.fn(function () {
    return {
      deriveApiKey: vi.fn().mockResolvedValue({ key: 'key', passphrase: 'passphrase', secret: 'secret' }),
    };
  }),
}));

vi.mock('@/features/polymarket/constants', () => ({
  BUILDER_CONFIG: {},
  POLYMARKET_BUILDER_CODE: 'rainbow-builder-code',
  POLYMARKET_CLOB_PROXY_URL: 'https://clob.test',
  POLYMARKET_RELAYER_PROXY_URL: 'https://relayer.test',
}));

vi.mock('@/features/polymarket/stores/polymarketWalletKindStore', async () => {
  const { createBaseStore } = await import('@storesjs/stores');
  return {
    usePolymarketWalletStore: createBaseStore(() => ({ getData: (): PolymarketWalletDescriptor | null => null })),
    getPolymarketWalletDescriptor: vi.fn(),
  };
});

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

const activeDescriptor: PolymarketWalletDescriptor = {
  address: wallet.address,
  kind: 'safe',
  owner: getAddress(signer.address),
  signatureType: 2,
};

const mockCreatePolymarketWallet = vi.mocked(createPolymarketWallet);
const mockLoadWallet = vi.mocked(loadWallet);
const mockRelayClient = vi.mocked(RelayClient);

describe('usePolymarketClients', () => {
  it('initializes attributed clients with the authenticated signer and rejects other accounts', async () => {
    usePolymarketWalletStore.setState({ getData: () => activeDescriptor });
    mockCreatePolymarketWallet.mockResolvedValue(wallet);
    const otherSigner = new Wallet('0x0000000000000000000000000000000000000000000000000000000000000002');
    const { getWallet, getClobClient } = usePolymarketClients.getState();
    if (!getWallet || !getClobClient) throw new Error('Expected active Polymarket clients');

    await expect(getPolymarketWallet('0x0000000000000000000000000000000000000003')).rejects.toThrow('does not match');
    await expect(getWallet(otherSigner)).rejects.toThrow('does not belong');
    expect(mockCreatePolymarketWallet).not.toHaveBeenCalled();

    await expect(getWallet(signer)).resolves.toBe(wallet);
    await getClobClient();
    expect(ClobClient).toHaveBeenLastCalledWith(expect.objectContaining({ builderConfig: { builderCode: POLYMARKET_BUILDER_CODE } }));

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
    usePolymarketWalletStore.setState({ getData: () => null });
    mockLoadWallet.mockResolvedValueOnce(originalSigner);
    mockCreatePolymarketWallet.mockResolvedValueOnce({ address, execute: vi.fn() });

    const pending = getPolymarketWallet(address);
    expect(getPolymarketWalletDescriptor).toHaveBeenCalledWith(descriptor.owner);
    selectedOwner = signer.address;
    usePolymarketWalletStore.setState({ getData: () => activeDescriptor });
    lookup.resolve(descriptor);

    await expect(pending).resolves.toMatchObject({ address });
    expect(usePolymarketClients.getState().proxyAddress).toBe(wallet.address);
    expect(mockLoadWallet).toHaveBeenLastCalledWith(expect.objectContaining({ address: descriptor.owner }));
    expect(mockCreatePolymarketWallet).toHaveBeenLastCalledWith(descriptor, expect.anything());
  });
});
