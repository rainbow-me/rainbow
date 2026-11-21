import { createBaseStore } from '@storesjs/stores';

import { type AccountMetadataRecord, type MultiAddressAccount } from '@/features/wallet/types';
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

export function getSolanaAccount(walletId: string, index: number): EnabledSolanaAccount | undefined {
  return useAccountMetadataStore.getState().accounts[solanaAccountId(walletId, index)];
}

export function publishSolanaAccount(record: EnabledSolanaAccount): void {
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
