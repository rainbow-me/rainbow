import { SignatureTypeV2 } from '@polymarket/clob-client-v2';
import { type Address } from 'viem';

import {
  resolvePolymarketWalletDescriptor,
  type PolymarketWalletDescriptorClient,
} from '@/features/polymarket/stores/polymarketWalletKindStore';
import { deriveSafeWalletAddress } from '@/features/polymarket/utils/deriveSafeWalletAddress';

jest.mock('@/features/polymarket/constants', () => ({
  POLYMARKET_RELAYER_PROXY_URL: 'https://relayer-v2.polymarket.com',
}));

jest.mock('@/state/wallets/walletsStore', () => ({
  useWalletsStore: Object.assign(jest.fn(), {
    getState: jest.fn(() => ({ accountAddress: null })),
    subscribe: jest.fn(() => jest.fn()),
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

function createClient({ safeDeployed }: { safeDeployed: boolean }): jest.Mocked<PolymarketWalletDescriptorClient> {
  return {
    deriveDepositWalletAddress: jest.fn().mockResolvedValue(beaconDepositWallet),
    getDeployed: jest.fn().mockResolvedValue(safeDeployed),
  };
}
