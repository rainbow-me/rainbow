import { useSelector } from 'react-redux';
import { useAccountSettings } from '.';
import { ENSRegistrationState } from '@rainbow-me/entities';
import { AppState } from '@rainbow-me/redux/store';

export default function useENSPendingRegistrations() {
  const { accountAddress } = useAccountSettings();
  const { pendingRegistrations } = useSelector(
    ({ ensRegistration }: AppState) => {
      const { registrations } = ensRegistration as ENSRegistrationState;
      const registrationsArray = Object.values(
        registrations?.[accountAddress.toLowerCase()] || {}
      );
      const pendingRegistrations = registrationsArray
        .filter(
          registration =>
            !registration?.registerTransactionHash &&
            registration?.commitTransactionHash
        )
        .sort(
          (a, b) =>
            (a?.commitTransactionConfirmedAt || 0) -
            (b?.commitTransactionConfirmedAt || 0)
        );

      return { pendingRegistrations };
    }
  );

  return {
    pendingRegistrations,
  };
}
