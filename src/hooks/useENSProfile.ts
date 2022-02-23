import { useDispatch, useSelector } from 'react-redux';
import { useAccountSettings } from '.';
import { ENSRegistrationState, Records } from '@rainbow-me/entities';
import {
  removeRecordByKey,
  updateRecordByKey,
  updateRecords,
} from '@rainbow-me/redux/ensRegistration';
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
      const records = registrationParameters?.records || {};
      return { name: currentRegistrationName, records, registrationParameters };
    }
  );
  const dispatch = useDispatch();

  return {
    name,
    records,
    registrationParameters,
    removeRecordByKey: (key: string) =>
      dispatch(removeRecordByKey(accountAddress, key)),
    updateRecordByKey: (key: string, value: string) =>
      dispatch(updateRecordByKey(accountAddress, key, value)),
    updateRecords: (records: Records) =>
      dispatch(updateRecords(accountAddress, records)),
  };
}
