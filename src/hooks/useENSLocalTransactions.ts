import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { useAccountSettings, usePendingTransactions } from '.';
import { ENSRegistrationState, RainbowTransaction } from '@/entities';
import { AppState } from '@/redux/store';
import { ethereumUtils } from '@/utils';
import { useConsolidatedTransactions } from '@/resources/transactions/consolidatedTransactions';

/**
 * @description Returns the local ENS transactions for a given name.
 * */
export default function useENSLocalTransactions({ name }: { name: string }) {
  const { accountAddress, nativeCurrency } = useAccountSettings();
  const { getPendingTransactionByHash } = usePendingTransactions();
  const { data } = useConsolidatedTransactions({
    address: accountAddress,
    currency: nativeCurrency,
  });

  const pages = data?.pages;

  const transactions: RainbowTransaction[] = useMemo(() => pages?.flatMap(p => p.transactions) || [], [pages]);
  const registration = useSelector(({ ensRegistration }: AppState) => {
    const { registrations } = ensRegistration as ENSRegistrationState;
    const accountRegistrations = registrations?.[accountAddress.toLowerCase()] || {};
    const registration = accountRegistrations[name];
    return registration;
  });

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
