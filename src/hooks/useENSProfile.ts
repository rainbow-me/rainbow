import { useCallback, useEffect } from 'react';
import { useQuery } from 'react-query';
import { useDispatch, useSelector } from 'react-redux';
import { useAccountSettings } from '.';
import { ENSRegistrationState, Records } from '@rainbow-me/entities';
import { fetchRecords } from '@rainbow-me/handlers/ens';
import * as ensRedux from '@rainbow-me/redux/ensRegistration';
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
  const removeRecordByKey = useCallback(
    (key: string) => dispatch(ensRedux.removeRecordByKey(accountAddress, key)),
    [accountAddress, dispatch]
  );
  const startRegistration = useCallback(
    (name: string, mode: 'create' | 'edit') =>
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

  const recordsQuery = useQuery(['records', name], () => fetchRecords(name), {
    enabled: mode === 'edit',
    notifyOnChangeProps: [
      'data',
      'error',
      'isIdle',
      'isLoading',
      'isSuccess',
      'isError',
    ],
  });
  useEffect(() => {
    if (mode === 'edit' && recordsQuery.isSuccess) {
      updateRecords(recordsQuery.data as Records);
    }
  }, [mode, recordsQuery.data, recordsQuery.isSuccess, updateRecords]);

  return {
    clearCurrentRegistrationName,
    mode,
    name,
    records,
    recordsQuery,
    registrationParameters,
    removeRecordByKey,
    startRegistration,
    updateRecordByKey,
    updateRecords,
  };
}
