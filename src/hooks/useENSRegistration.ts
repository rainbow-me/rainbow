import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAccountSettings } from '.';
import { Records } from '@rainbow-me/entities';
import { REGISTRATION_MODES } from '@rainbow-me/helpers/ens';
import * as ensRedux from '@rainbow-me/redux/ensRegistration';
import { AppState } from '@rainbow-me/redux/store';

export default function useENSRegistration() {
  const { accountAddress } = useAccountSettings();

  const registrationParameters = useSelector(
    ({ ensRegistration }: AppState) => {
      return {
        ...ensRegistration.registrations?.[accountAddress?.toLowerCase()]?.[
          ensRegistration.currentRegistrationName
        ],
        currentRegistrationName: ensRegistration.currentRegistrationName,
      };
    }
  );

  const { mode, name, initialRecords, records } = useMemo(
    () => ({
      initialRecords: registrationParameters.initialRecords || {},
      mode: registrationParameters.mode,
      name: registrationParameters.currentRegistrationName,
      records: registrationParameters.records || {},
    }),
    [
      registrationParameters.initialRecords,
      registrationParameters.mode,
      registrationParameters.currentRegistrationName,
      registrationParameters.records,
    ]
  );

  const dispatch = useDispatch();
  const removeRecordByKey = useCallback(
    (key: string) => dispatch(ensRedux.removeRecordByKey(accountAddress, key)),
    [accountAddress, dispatch]
  );
  const startRegistration = useCallback(
    (name: string, mode: keyof typeof REGISTRATION_MODES) =>
      dispatch(ensRedux.startRegistration(accountAddress, name, mode)),
    [accountAddress, dispatch]
  );
  const updateRecordByKey = useCallback(
    (key: string, value: string) =>
      dispatch(ensRedux.updateRecordByKey(accountAddress, key, value)),
    [accountAddress, dispatch]
  );
  const updateRecords = useCallback(
    (records: Records) =>
      dispatch(ensRedux.updateRecords(accountAddress, records)),
    [accountAddress, dispatch]
  );
  const clearCurrentRegistrationName = useCallback(
    () => dispatch(ensRedux.clearCurrentRegistrationName()),
    [dispatch]
  );

  const removeRegistrationByName = useCallback(
    (name: string) =>
      dispatch(ensRedux.removeRegistrationByName(accountAddress, name)),
    [accountAddress, dispatch]
  );

  return {
    clearCurrentRegistrationName,
    initialRecords,
    mode,
    name,
    records,
    registrationParameters,
    removeRecordByKey,
    removeRegistrationByName,
    startRegistration,
    updateRecordByKey,
    updateRecords,
  };
}
