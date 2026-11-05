import { Wallet } from '@ethersproject/wallet';
import { ed25519 } from '@noble/curves/ed25519';
import { mnemonicToSeedSync } from 'bip39';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { base58Decode } from '@/features/solana/core/address';
import { useIsSolanaEnabled } from '@/features/solana/hooks/useIsSolanaEnabled';
import { decodeSolanaKey, solanaKeyFromSeed } from '@/features/wallet/core/solanaAccount';
import { EncryptionType, type RainbowWallet } from '@/features/wallet/types';
import { EthereumWalletType } from '@/helpers/walletTypes';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { SolanaCluster, type SolanaSigner } from '@rainbow-me/solana-sdk';

import { enableSolanaAccount, getSolanaSource } from './enableSolanaAccount';
import { withSolanaSigner } from './loadSolanaSigner';
import { readSolanaKey, saveSolanaKey } from './solanaKeychain';
import { getCombinedAccount, getSolanaAccount, publishSolanaAccount, useAccountMetadataStore } from './stores/accountMetadataStore';
import { getSeedPhrase } from './walletKeychain';

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

  it('does not publish on persistence failure, cancellation or selection change', async () => {
    vi.mocked(saveSolanaKey).mockRejectedValueOnce(new Error('cancelled'));
    await expect(enableSolanaAccount()).rejects.toThrow('cancelled');
    expect(getSolanaAccount('test', 2)).toBeUndefined();
    vi.mocked(getSeedPhrase).mockImplementationOnce(async () => {
      state.accountAddress = '0x0000000000000000000000000000000000000002';
      return { id: 'test', seedphrase: phrase, version: 1 };
    });
    await expect(enableSolanaAccount()).rejects.toThrow();
    expect(getSolanaAccount('test', 2)).toBeUndefined();
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
    expect(getSolanaAccount('test', 2)).toBeUndefined();
    state.wallets = {};
    expect(getSolanaAccount('test', 2)).toBeUndefined();
  });

  it('does not persist a signer derived from a mnemonic that does not own the source EVM address', async () => {
    state.accountAddress = '0x0000000000000000000000000000000000000002';
    state.wallets.test.addresses[0].address = state.accountAddress;
    await expect(enableSolanaAccount()).rejects.toThrow('does not match');
    expect(saveSolanaKey).not.toHaveBeenCalled();
  });

  it('signs with the stored key and destroys the signer capability when its scope ends', async () => {
    publishSolanaAccount(record);
    const bytes = decodeSolanaKey(key, key.address);
    vi.mocked(readSolanaKey).mockResolvedValue(bytes);
    let retained: SolanaSigner | undefined;
    const messageBytes = new Uint8Array([1, 2]);
    await withSolanaSigner(record, async signer => {
      retained = signer;
      const signature = await signer.signTransactionMessage({ cluster: SolanaCluster.Mainnet, messageBytes });
      expect(ed25519.verify(signature, messageBytes, base58Decode(record.address)!)).toBe(true);
      await expect(signer.signTransactionMessage({ cluster: SolanaCluster.Devnet, messageBytes })).rejects.toThrow();
      state.accountAddress = '0x0000000000000000000000000000000000000002';
      await expect(signer.signTransactionMessage({ cluster: SolanaCluster.Mainnet, messageBytes })).rejects.toThrow();
    });
    expect(bytes.every(byte => byte === 0)).toBe(true);
    await expect(retained!.signTransactionMessage({ cluster: SolanaCluster.Mainnet, messageBytes })).rejects.toThrow();
  });
});
