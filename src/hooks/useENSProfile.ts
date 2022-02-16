import { useSelector } from 'react-redux';
import { useAccountSettings } from '.';
import { ENSRegistrationState } from '@rainbow-me/entities';
import { AppState } from '@rainbow-me/redux/store';

export default function useENSProfile() {
  const { accountAddress } = useAccountSettings();
  const { records, name, registrationParameters } = useSelector(
    ({ ensRegistration }: AppState) => {
      const {
        currentRegistrationName,
        registrations,
      } = ensRegistration as ENSRegistrationState;
      const registrationParameters =
        registrations?.[accountAddress?.toLowerCase()]?.[
          currentRegistrationName
        ] || {};
      const records = registrationParameters?.records || [];
      return { name: currentRegistrationName, records, registrationParameters };
    }
  );

  return {
    name,
    records,
    registrationParameters,
  };
}
