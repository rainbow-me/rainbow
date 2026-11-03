import { SignatureTypeV2 } from '@polymarket/clob-client-v2';
import { type Address } from 'viem';
import { describe, expect, it, vi, type Mocked } from 'vitest';

import {
  resolvePolymarketWalletDescriptor,
  type PolymarketWalletDescriptorClient,
} from '@/features/polymarket/stores/polymarketWalletKindStore';
import { deriveSafeWalletAddress } from '@/features/polymarket/utils/deriveSafeWalletAddress';

vi.mock('@/features/polymarket/constants', () => ({
  POLYMARKET_RELAYER_PROXY_URL: 'https://relayer-v2.polymarket.com',
}));

vi.mock('@/state/wallets/walletsStore', () => ({
  useWalletsStore: Object.assign(vi.fn(), {
    getState: vi.fn(() => ({ accountAddress: null })),
    subscribe: vi.fn(() => vi.fn()),
  }),
}));

const owner: Address = '0x1208C8B837F68468457c83DD256e817BD5B3E0b7';
const beaconDepositWallet: Address = '0xb000000000000000000000000000000000000001';

describe('resolvePolymarketWalletDescriptor', () => {
  it('uses the deployed Safe when the owner already has one', async () => {
    const client = createClient({ safeDeployed: true });

    await expect(resolvePolymarketWalletDescriptor(owner, client)).resolves.toEqual({
      address: deriveSafeWalletAddress(owner),
      kind: 'safe',
      owner,
      signatureType: SignatureTypeV2.POLY_GNOSIS_SAFE,
    });

    expect(client.deriveDepositWalletAddress).not.toHaveBeenCalled();
  });

  it('uses the relayer client deposit wallet derivation for new Deposit Wallet accounts', async () => {
    const client = createClient({ safeDeployed: false });

    await expect(resolvePolymarketWalletDescriptor(owner, client)).resolves.toEqual({
      address: beaconDepositWallet,
      kind: 'depositWallet',
      owner,
      signatureType: SignatureTypeV2.POLY_1271,
    });

    expect(client.deriveDepositWalletAddress).toHaveBeenCalledTimes(1);
  });
});

function createClient({ safeDeployed }: { safeDeployed: boolean }): Mocked<PolymarketWalletDescriptorClient> {
  return {
    deriveDepositWalletAddress: vi.fn().mockResolvedValue(beaconDepositWallet),
    getDeployed: vi.fn().mockResolvedValue(safeDeployed),
  };
}
