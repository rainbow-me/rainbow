import { HDNode, isValidMnemonic } from '@ethersproject/hdnode';
import { mnemonicToSeed } from 'bip39';

import { IS_STORE_INSTALL } from '@/env';
import { useIsSolanaEnabled } from '@/features/solana/hooks/useIsSolanaEnabled';
import { solanaKeyFromSeed } from '@/features/wallet/core/solanaAccount';
import { getHdPath, WalletLibraryType } from '@/features/wallet/core/walletLibrary';
import { saveSolanaKey } from '@/features/wallet/data/solanaKeychain';
import { getSolanaAccount, publishSolanaAccount, type EnabledSolanaAccount } from '@/features/wallet/data/stores/accountMetadataStore';
import { getSeedPhrase } from '@/features/wallet/data/walletKeychain';
import { type AccountRef } from '@/features/wallet/types';
import { EthereumWalletType } from '@/helpers/walletTypes';
import { useWalletsStore } from '@/state/wallets/walletsStore';

export type SolanaSource = AccountRef & { sourceEvmAddress: string };

export function getSolanaSource(): SolanaSource {
  if (IS_STORE_INSTALL || !useIsSolanaEnabled.getState()) throw new Error('Enable the Solana developer flag in an internal build.');
  const state = useWalletsStore.getState();
  const wallet = state.selected && state.wallets[state.selected.id];
  const account = wallet?.addresses.find(item => item.address.toLowerCase() === state.accountAddress.toLowerCase());
  if (!state.walletReady || wallet?.type !== EthereumWalletType.mnemonic || !account?.visible || wallet.damaged) {
    throw new Error('Select an accessible recovery phrase wallet.');
  }
  return { walletId: wallet.id, index: account.index, sourceEvmAddress: account.address };
}

export function assertSolanaSource(source: SolanaSource): void {
  const current = getSolanaSource();
  if (
    current.walletId !== source.walletId ||
    current.index !== source.index ||
    current.sourceEvmAddress.toLowerCase() !== source.sourceEvmAddress.toLowerCase()
  ) {
    throw new Error('The selected account changed. Start again from that account.');
  }
}

export function requireEnabledSolanaAccount(): EnabledSolanaAccount {
  const source = getSolanaSource();
  const record = getSolanaAccount(source.walletId, source.index);
  if (!record) throw new Error('Enable Solana for this account first.');
  return record;
}

let enabling = false;

export async function enableSolanaAccount(): Promise<EnabledSolanaAccount> {
  if (enabling) throw new Error('Solana is already being enabled.');
  const source = getSolanaSource();
  enabling = true;
  let seed: Uint8Array | undefined;
  try {
    const data = await getSeedPhrase(source.walletId);
    assertSolanaSource(source);
    if (!data || data.id !== source.walletId || !isValidMnemonic(data.seedphrase)) throw new Error('Unable to unlock the recovery phrase.');
    seed = new Uint8Array(await mnemonicToSeed(data.seedphrase));
    assertSolanaSource(source);
    const evmAddress = HDNode.fromSeed(seed).derivePath(getHdPath({ type: WalletLibraryType.bip39, index: source.index })).address;
    if (evmAddress.toLowerCase() !== source.sourceEvmAddress.toLowerCase())
      throw new Error('The recovery phrase does not match this EVM account.');
    const key = solanaKeyFromSeed(seed, source.index);
    await saveSolanaKey(key);
    assertSolanaSource(source);
    const record: EnabledSolanaAccount = { ...source, namespace: 'solana', address: key.address, version: 1 };
    publishSolanaAccount(record);
    return record;
  } finally {
    seed?.fill(0);
    // eslint-disable-next-line require-atomic-updates -- only the operation holding this lock reaches finally
    enabling = false;
  }
}
