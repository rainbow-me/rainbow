import { useSelector } from 'react-redux';
import { useAccountSettings, useAccountTransactions, usePendingTransactions } from '.';
import { ENSRegistrationState } from '@/entities';
import { AppState } from '@/redux/store';
import { ethereumUtils } from '@/utils';

/**
 * @description Returns the local ENS transactions for a given name.
 * */
export default function useENSLocalTransactions({ name }: { name: string }) {
  const { accountAddress } = useAccountSettings();
  const { getPendingTransactionByHash } = usePendingTransactions();
  const { transactions } = useAccountTransactions(true, true);

  const registration = useSelector(({ ensRegistration }: AppState) => {
    const { registrations } = ensRegistration as ENSRegistrationState;
    const accountRegistrations = registrations?.[accountAddress.toLowerCase()] || {};
    const registration = accountRegistrations[name];
    return registration;
  });

  const commitTransactionHash = registration?.commitTransactionHash?.toString();
  const pendingRegistrationTransaction = getPendingTransactionByHash(registration?.registerTransactionHash?.toString() || '');
  const confirmedRegistrationTransaction = transactions.find(
    (txn: any) => ethereumUtils.getHash(txn) === registration?.registerTransactionHash && !txn.pending
  );

  return {
    commitTransactionHash,
    confirmedRegistrationTransaction,
    pendingRegistrationTransaction,
  };
}
