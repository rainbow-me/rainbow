import { useDispatch, useSelector } from 'react-redux';
import { useAccountSettings } from '.';
import { ENSRegistrationState, Records } from '@rainbow-me/entities';
import {
  removeRecordByKey,
  startRegistration,
  updateRecordByKey,
  updateRecords,
} from '@rainbow-me/redux/ensRegistration';
import { AppState } from '@rainbow-me/redux/store';

export default function useENSProfile() {
  const { accountAddress } = useAccountSettings();
  const { mode, records, name, registrationParameters } = useSelector(
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
      const mode = registrationParameters?.mode || {};
      return {
        mode,
        name: currentRegistrationName,
        records,
        registrationParameters,
      };
    }
  );
  const dispatch = useDispatch();

  return {
    mode,
    name,
    records,
    registrationParameters,
    removeRecordByKey: (key: string) =>
      dispatch(removeRecordByKey(accountAddress, key)),
    startRegistration: (name: string, mode: 'create' | 'edit') =>
      dispatch(startRegistration(accountAddress, name, mode)),
    updateRecordByKey: (key: string, value: string) =>
      dispatch(updateRecordByKey(accountAddress, key, value)),
    updateRecords: (records: Records) =>
      dispatch(updateRecords(accountAddress, records)),
  };
}
