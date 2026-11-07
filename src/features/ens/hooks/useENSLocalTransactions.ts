import { useMemo } from 'react';

import { type RainbowTransaction } from '@/entities/transactions';
import usePendingTransactions from '@/hooks/usePendingTransactions';
import { useConsolidatedTransactions } from '@/resources/transactions/consolidatedTransactions';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useAccountAddress } from '@/state/wallets/walletsStore';
import ethereumUtils from '@/utils/ethereumUtils';

import { useEnsRegistrationStore } from '../data/stores/registrationStore';

/**
 * @description Returns the local ENS transactions for a given name.
 * */
export default function useENSLocalTransactions({ name }: { name: string }) {
  const accountAddress = useAccountAddress();
  const nativeCurrency = userAssetsStoreManager(state => state.currency);
  const { getPendingTransactionByHash } = usePendingTransactions();
  const { data } = useConsolidatedTransactions({
    address: accountAddress,
    currency: nativeCurrency,
  });

  const pages = data?.pages;

  const transactions: RainbowTransaction[] = useMemo(() => pages?.flatMap(p => p.transactions) || [], [pages]);
  const registration = useEnsRegistrationStore(s => s.registrations[accountAddress.toLowerCase()]?.[name]);

  const commitTransactionHash = registration?.commitTransactionHash?.toString();
  const pendingRegistrationTransaction = getPendingTransactionByHash(registration?.registerTransactionHash?.toString() || '');
  const confirmedRegistrationTransaction = transactions?.find(
    (txn: any) => ethereumUtils.getHash(txn) === registration?.registerTransactionHash && !txn.pending
  );

  return {
    commitTransactionHash,
    confirmedRegistrationTransaction,
    pendingRegistrationTransaction,
  };
}
