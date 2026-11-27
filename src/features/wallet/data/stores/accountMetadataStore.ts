import { createBaseStore } from '@storesjs/stores';

import { type AccountMetadataRecord } from '@/features/wallet/types';

export type EnabledSolanaAccount = AccountMetadataRecord & {
  namespace: 'solana';
  sourceEvmAddress: string;
};

export const solanaAccountId = (walletId: string, index: number) => `${walletId}-${index}`;

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
