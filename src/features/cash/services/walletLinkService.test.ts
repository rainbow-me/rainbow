import { type Address } from 'viem';

import { loadWallet } from '@/features/wallet/data/loadWallet';
import { signPersonalMessage } from '@/model/wallet';

import { useCashAccountStore } from '../stores/cashAccountStore';
import { useCashWalletStore } from '../stores/cashWalletStore';
import { ensureAccessToken } from './cashSignInService';
import { linkWallet, listWallets } from './rampClient';
import { checkWalletLink, linkWalletWithSignature, WalletSignatureError } from './walletLinkService';

jest.mock('react-native-dotenv', () => ({ IS_TESTING: 'false' }));

jest.mock('./rampClient', () => ({
  listWallets: jest.fn(),
  linkWallet: jest.fn(),
  WalletSignatureMethod: { EthPersonalSign: 'WALLET_SIGNATURE_METHOD_ETH_PERSONAL_SIGN' },
}));

jest.mock('./cashSignInService', () => ({
  ensureAccessToken: jest.fn(),
}));

jest.mock('@/features/wallet/data/loadWallet', () => ({
  loadWallet: jest.fn(),
}));

jest.mock('@/model/wallet', () => ({
  signPersonalMessage: jest.fn(),
}));

jest.mock('@/handlers/web3', () => ({
  getProvider: jest.fn(() => ({})),
}));

const mockListWallets = listWallets as jest.Mock;
const mockLinkWallet = linkWallet as jest.Mock;
const mockEnsureAccessToken = ensureAccessToken as jest.Mock;
const mockLoadWallet = loadWallet as jest.Mock;
const mockSignPersonalMessage = signPersonalMessage as jest.Mock;

const USER_ID = 'a7f1c2d3-0000-4000-8000-000000000001';
const ADDRESS = '0xAbC0000000000000000000000000000000000001' as Address;
const LOWERCASE_ADDRESS = '0xabc0000000000000000000000000000000000001';
const OTHER_ADDRESS = '0x0000000000000000000000000000000000000002';
const SIGNATURE = '0xf00d';
const NOW_MS = 1785312000000;
const TIMESTAMP = 1785312000;
const UNLOCK_DELAY_MS = 90_000;

let nowMs = NOW_MS;

beforeEach(() => {
  jest.clearAllMocks();
  nowMs = NOW_MS;
  jest.spyOn(Date, 'now').mockImplementation(() => nowMs);
  useCashAccountStore.setState({ userId: USER_ID });
  useCashWalletStore.setState({ linkedWallets: [] });
  mockEnsureAccessToken.mockResolvedValue('jwt');
  mockListWallets.mockResolvedValue([]);
  mockLinkWallet.mockResolvedValue({ id: 'wallet-1', address: ADDRESS });
  mockLoadWallet.mockResolvedValue({});
  mockSignPersonalMessage.mockResolvedValue({ result: SIGNATURE });
});

describe('checkWalletLink', () => {
  it('acquires a token before asking the backend', async () => {
    const order: string[] = [];
    mockEnsureAccessToken.mockImplementation(async () => {
      order.push('token');
      return 'jwt';
    });
    mockListWallets.mockImplementation(async () => {
      order.push('list');
      return [];
    });

    await expect(checkWalletLink(ADDRESS)).resolves.toBe('needsLink');

    expect(order).toEqual(['token', 'list']);
  });

  it('does not ask the backend when sign-in fails', async () => {
    mockEnsureAccessToken.mockRejectedValue(new Error('cancelled'));

    await expect(checkWalletLink(ADDRESS)).rejects.toThrow('cancelled');

    expect(mockListWallets).not.toHaveBeenCalled();
  });

  it('answers from the cache without a request, whatever the casing', async () => {
    useCashWalletStore.setState({ linkedWallets: [{ id: 'wallet-1', address: LOWERCASE_ADDRESS }] });

    await expect(checkWalletLink(ADDRESS)).resolves.toBe('linked');

    expect(mockListWallets).not.toHaveBeenCalled();
  });

  it('replaces the cache with the fetched list, lowercased', async () => {
    useCashWalletStore.setState({ linkedWallets: [{ id: 'stale', address: OTHER_ADDRESS }] });
    mockListWallets.mockResolvedValue([{ id: 'wallet-1', address: ADDRESS }]);
    const abortController = new AbortController();

    await expect(checkWalletLink(ADDRESS, abortController)).resolves.toBe('linked');

    expect(mockListWallets).toHaveBeenCalledWith(abortController);
    expect(useCashWalletStore.getState().linkedWallets).toEqual([{ id: 'wallet-1', address: LOWERCASE_ADDRESS }]);
  });

  it('reports a fetched list that omits the address as needing a link', async () => {
    mockListWallets.mockResolvedValue([{ id: 'other', address: OTHER_ADDRESS }]);

    await expect(checkWalletLink(ADDRESS)).resolves.toBe('needsLink');
  });
});

describe('linkWalletWithSignature', () => {
  it('signs the lowercase link message and posts the timestamp it signed, not a fresher one', async () => {
    // Signing takes real time, so a body timestamp read from the clock a second time would diverge.
    mockSignPersonalMessage.mockImplementation(async () => {
      nowMs += UNLOCK_DELAY_MS;
      return { result: SIGNATURE };
    });

    await linkWalletWithSignature(ADDRESS);

    expect(mockSignPersonalMessage).toHaveBeenCalledWith(
      `rainbow/${USER_ID}/link-wallet/${LOWERCASE_ADDRESS}/${TIMESTAMP}`,
      expect.anything(),
      expect.anything()
    );
    expect(mockLinkWallet).toHaveBeenCalledWith(
      {
        address: LOWERCASE_ADDRESS,
        signature: { hexSignature: SIGNATURE, method: 'WALLET_SIGNATURE_METHOD_ETH_PERSONAL_SIGN', timestamp: String(TIMESTAMP) },
      },
      undefined
    );
    expect(useCashWalletStore.getState().linkedWallets).toEqual([{ id: 'wallet-1', address: LOWERCASE_ADDRESS }]);
  });

  it('mints the timestamp after the wallet unlock, so a slow prompt does not age the signature', async () => {
    mockLoadWallet.mockImplementation(async () => {
      nowMs += UNLOCK_DELAY_MS;
      return {};
    });
    const unlockedTimestamp = TIMESTAMP + UNLOCK_DELAY_MS / 1000;

    await linkWalletWithSignature(ADDRESS);

    expect(mockSignPersonalMessage).toHaveBeenCalledWith(
      `rainbow/${USER_ID}/link-wallet/${LOWERCASE_ADDRESS}/${unlockedTimestamp}`,
      expect.anything(),
      expect.anything()
    );
    expect(mockLinkWallet).toHaveBeenCalledWith(
      expect.objectContaining({ signature: expect.objectContaining({ timestamp: String(unlockedTimestamp) }) }),
      undefined
    );
  });

  it('loads the signer for the checksummed address it was given', async () => {
    await linkWalletWithSignature(ADDRESS);

    expect(mockLoadWallet).toHaveBeenCalledWith(expect.objectContaining({ address: ADDRESS }));
  });

  it('rejects without signing when no account is recorded', async () => {
    useCashAccountStore.setState({ userId: null });

    await expect(linkWalletWithSignature(ADDRESS)).rejects.toThrow('No cash account recorded on this device');

    expect(mockSignPersonalMessage).not.toHaveBeenCalled();
    expect(mockLinkWallet).not.toHaveBeenCalled();
  });

  it('does not post when the wallet cannot be loaded', async () => {
    mockLoadWallet.mockResolvedValue(null);

    await expect(linkWalletWithSignature(ADDRESS)).rejects.toThrow(WalletSignatureError);

    expect(mockLinkWallet).not.toHaveBeenCalled();
  });

  it('does not post when signing fails', async () => {
    mockSignPersonalMessage.mockResolvedValue({ error: new Error('user rejected') });

    await expect(linkWalletWithSignature(ADDRESS)).rejects.toThrow(WalletSignatureError);

    expect(mockLinkWallet).not.toHaveBeenCalled();
    expect(useCashWalletStore.getState().linkedWallets).toEqual([]);
  });

  it('does not record the wallet when the request fails', async () => {
    mockLinkWallet.mockRejectedValue(new Error('signature invalid'));

    await expect(linkWalletWithSignature(ADDRESS)).rejects.toThrow('signature invalid');

    expect(useCashWalletStore.getState().linkedWallets).toEqual([]);
  });
});
