import { createBaseStore } from '@storesjs/stores';

import { isSolanaAddress } from '@/features/solana/core/address';
import { type AccountMetadataRecord, type MultiAddressAccount } from '@/features/wallet/types';
import { EthereumWalletType } from '@/helpers/walletTypes';
import { useWalletsStore } from '@/state/wallets/walletsStore';

export type EnabledSolanaAccount = AccountMetadataRecord & {
  namespace: 'solana';
  sourceEvmAddress: string;
};

export const solanaAccountId = (walletId: string, index: number) => JSON.stringify([walletId, index]);

export const useAccountMetadataStore = createBaseStore<{ accounts: Record<string, EnabledSolanaAccount> }>(() => ({ accounts: {} }), {
  storageKey: 'solanaAccountMetadata',
  version: 1,
});

export function matchesSource(record: EnabledSolanaAccount): boolean {
  if (
    !record ||
    typeof record.walletId !== 'string' ||
    !Number.isSafeInteger(record.index) ||
    record.index < 0 ||
    typeof record.address !== 'string' ||
    typeof record.sourceEvmAddress !== 'string'
  )
    return false;
  const state = useWalletsStore.getState();
  const wallet = state.wallets[record.walletId];
  return Boolean(
    state.walletReady &&
    wallet?.type === EthereumWalletType.mnemonic &&
    !wallet.damaged &&
    record.version === 1 &&
    record.namespace === 'solana' &&
    isSolanaAddress(record.address) &&
    wallet.addresses.some(
      account =>
        account.index === record.index && account.visible && account.address.toLowerCase() === record.sourceEvmAddress.toLowerCase()
    )
  );
}

export function getSolanaAccount(walletId: string, index: number): EnabledSolanaAccount | undefined {
  const record = useAccountMetadataStore.getState().accounts[solanaAccountId(walletId, index)];
  return record && matchesSource(record) ? record : undefined;
}

export function publishSolanaAccount(record: EnabledSolanaAccount): void {
  if (!matchesSource(record)) throw new Error('The source account changed. Select it and enable Solana again.');
  useAccountMetadataStore.setState(state => ({
    accounts: { ...state.accounts, [solanaAccountId(record.walletId, record.index)]: record },
  }));
}

/** Profiles and selection remain owned by walletsStore; only the extra address is persisted here. */
export function getCombinedAccount(walletId: string, index: number): MultiAddressAccount | undefined {
  const wallet = useWalletsStore.getState().wallets[walletId];
  const account = wallet?.addresses.find(item => item.index === index && item.visible);
  const solana = getSolanaAccount(walletId, index);
  if (!account || !solana) return undefined;
  const { address, ens, ...profile } = account;
  return { ...profile, walletId, addresses: { eip155: { address, ens }, solana: { address: solana.address } } };
}
