import { useSelector } from 'react-redux';
import { useAccountSettings, usePendingTransactions } from '.';
import { ENSRegistrationState } from '@rainbow-me/entities';
import { AppState } from '@rainbow-me/redux/store';

/**
 * @description Returns the pending ENS transactions for a given name.
 * */
export default function useENSPendingTransactions({ name }: { name: string }) {
  const { accountAddress } = useAccountSettings();
  const { getPendingTransactionByHash } = usePendingTransactions();

  const registration = useSelector(({ ensRegistration }: AppState) => {
    const { registrations } = ensRegistration as ENSRegistrationState;
    const accountRegistrations =
      registrations?.[accountAddress.toLowerCase()] || {};
    const registration = accountRegistrations[name];
    return registration;
  });

  const pendingRegistrationTransaction = getPendingTransactionByHash(
    registration?.registerTransactionHash?.toString() || ''
  );

  return {
    pendingRegistrationTransaction,
  };
}
