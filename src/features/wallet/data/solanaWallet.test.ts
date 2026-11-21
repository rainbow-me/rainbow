import { Wallet } from '@ethersproject/wallet';
import { mnemonicToSeedSync } from 'bip39';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useIsSolanaEnabled } from '@/features/solana/hooks/useIsSolanaEnabled';
import { decodeSolanaKey, solanaKeyFromSeed } from '@/features/wallet/core/solanaAccount';
import { EncryptionType, type RainbowWallet } from '@/features/wallet/types';
import { EthereumWalletType } from '@/helpers/walletTypes';
import { useWalletsStore } from '@/state/wallets/walletsStore';

import { enableSolanaAccount, getSolanaSource } from './enableSolanaAccount';
import { readSolanaKey, saveSolanaKey } from './solanaKeychain';
import { getCombinedAccount, getSolanaAccount, publishSolanaAccount, useAccountMetadataStore } from './stores/accountMetadataStore';
import { getSeedPhrase } from './walletKeychain';

vi.mock('@/env', () => ({ IS_DEV: false, IS_TEST: true, IS_PROD: false, IS_STORE_INSTALL: true }));
vi.mock('react-native', () => ({ Platform: { OS: 'ios' }, NativeModules: {} }));
vi.mock('@/state/wallets/walletsStore', () => ({ useWalletsStore: { getState: vi.fn() } }));
vi.mock('@/features/solana/hooks/useIsSolanaEnabled', () => ({ useIsSolanaEnabled: { getState: vi.fn() } }));
vi.mock('./walletKeychain', () => ({ getSeedPhrase: vi.fn() }));
vi.mock('./solanaKeychain', () => ({ readSolanaKey: vi.fn(), saveSolanaKey: vi.fn() }));

const phrase = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const evm = Wallet.fromMnemonic(phrase, "m/44'/60'/0'/0/2").address;
const wallet: RainbowWallet = {
  id: 'test',
  type: EthereumWalletType.mnemonic,
  name: 'Test',
  color: 0,
  imported: true,
  primary: true,
  encryptionType: EncryptionType.keychain,
  addresses: [{ address: evm, index: 2, label: 'Third', avatar: null, color: 1, visible: true }],
};
let state: ReturnType<typeof useWalletsStore.getState>;
const key = solanaKeyFromSeed(mnemonicToSeedSync(phrase), 2);
const record = {
  walletId: 'test',
  index: 2,
  sourceEvmAddress: evm,
  namespace: 'solana' as const,
  version: 1 as const,
  address: key.address,
};

beforeEach(() => {
  vi.resetAllMocks();
  state = {
    wallets: { test: structuredClone(wallet) },
    selected: wallet,
    accountAddress: evm,
    walletReady: true,
  } as unknown as typeof state;
  vi.mocked(useWalletsStore.getState).mockImplementation(() => state);
  vi.mocked(useIsSolanaEnabled.getState).mockReturnValue(true);
  vi.mocked(getSeedPhrase).mockResolvedValue({ id: 'test', seedphrase: phrase, version: 1 });
  vi.mocked(readSolanaKey).mockResolvedValue(decodeSolanaKey(key, key.address));
  useAccountMetadataStore.setState({ accounts: {} });
});

describe('additive Solana wallet lifecycle', () => {
  it('allows store installs only while the Solana flag is enabled', () => {
    expect(getSolanaSource()).toEqual({ walletId: 'test', index: 2, sourceEvmAddress: evm });
    vi.mocked(useIsSolanaEnabled.getState).mockReturnValue(false);
    expect(getSolanaSource).toThrow();
  });

  it('derives the selected index, verifies persistence before publication and joins existing profile fields', async () => {
    expect(await enableSolanaAccount()).toEqual(record);
    expect(saveSolanaKey).toHaveBeenCalledWith(key);
    expect(getCombinedAccount('test', 2)).toMatchObject({
      label: 'Third',
      color: 1,
      addresses: { eip155: { address: evm }, solana: { address: key.address } },
    });
    expect(state.wallets.test).toEqual(wallet);
  });

  it('does not publish on persistence failure or authentication cancellation', async () => {
    vi.mocked(saveSolanaKey).mockRejectedValueOnce(new Error('save failed'));
    await expect(enableSolanaAccount()).rejects.toThrow('save failed');
    expect(getSolanaAccount('test', 2)).toBeUndefined();
    vi.mocked(getSeedPhrase).mockRejectedValueOnce(new Error('cancelled'));
    await expect(enableSolanaAccount()).rejects.toThrow('cancelled');
    expect(getSolanaAccount('test', 2)).toBeUndefined();
  });

  it.each(['authentication', 'key persistence'])('enables the captured account when selection changes during %s', async stage => {
    const switchWallet = () => {
      const other = {
        ...wallet,
        id: 'other',
        addresses: [{ ...wallet.addresses[0], address: '0x0000000000000000000000000000000000000002' as const }],
      };
      state.wallets.other = other;
      state.selected = other;
      state.accountAddress = other.addresses[0].address;
    };
    if (stage === 'authentication') {
      vi.mocked(getSeedPhrase).mockImplementationOnce(async () => {
        switchWallet();
        return { id: 'test', seedphrase: phrase, version: 1 };
      });
    } else {
      vi.mocked(saveSolanaKey).mockImplementationOnce(async () => switchWallet());
    }
    expect(await enableSolanaAccount()).toEqual(record);
    expect(getSeedPhrase).toHaveBeenCalledWith('test');
    expect(saveSolanaKey).toHaveBeenCalledWith(key);
    expect(getSolanaAccount('test', 2)).toEqual(record);
    expect(getSolanaAccount('other', 2)).toBeUndefined();
    expect(state.selected?.id).toBe('other');
  });

  it('publishes captured-account metadata without rechecking wallet existence', async () => {
    vi.mocked(saveSolanaKey).mockImplementationOnce(async () => {
      state.wallets = {};
    });
    expect(await enableSolanaAccount()).toEqual(record);
    expect(getSolanaAccount('test', 2)).toEqual(record);
    expect(getSolanaSource).toThrow();
  });

  it('rejects unsupported, disabled, damaged and deleted sources', () => {
    for (const type of [EthereumWalletType.readOnly, EthereumWalletType.privateKey, EthereumWalletType.bluetooth]) {
      state.wallets.test.type = type;
      expect(getSolanaSource).toThrow();
    }
    state.wallets.test.type = EthereumWalletType.mnemonic;
    vi.mocked(useIsSolanaEnabled.getState).mockReturnValue(false);
    expect(getSolanaSource).toThrow();
    vi.mocked(useIsSolanaEnabled.getState).mockReturnValue(true);
    publishSolanaAccount(record);
    state.wallets.test.damaged = true;
    expect(getSolanaSource).toThrow();
    expect(getSolanaAccount('test', 2)).toEqual(record);
    state.wallets = {};
    expect(getSolanaSource).toThrow();
    expect(getSolanaAccount('test', 2)).toEqual(record);
  });

  it('does not persist a signer derived from a mnemonic that does not own the source EVM address', async () => {
    state.accountAddress = '0x0000000000000000000000000000000000000002';
    state.wallets.test.addresses[0].address = state.accountAddress;
    await expect(enableSolanaAccount()).rejects.toThrow('does not match');
    expect(saveSolanaKey).not.toHaveBeenCalled();
  });
});
