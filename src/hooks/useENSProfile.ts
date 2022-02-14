import { useSelector } from 'react-redux';
import { useAccountSettings } from '.';
import { ENSRegistrationState } from '@rainbow-me/entities';
import { AppState } from '@rainbow-me/redux/store';

export default function useENSProfile() {
  const { accountAddress } = useAccountSettings();
  const { records, name } = useSelector(({ ensRegistration }: AppState) => {
    const {
      currentRegistrationName,
      registrations,
    } = ensRegistration as ENSRegistrationState;
    const records =
      registrations?.[accountAddress?.toLowerCase()]?.[currentRegistrationName]
        ?.records;
    return { name: currentRegistrationName, records };
  });

  return {
    name,
    records,
  };
}
