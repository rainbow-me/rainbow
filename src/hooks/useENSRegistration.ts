import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAccountSettings } from '.';
import { Records } from '@/entities';
import { REGISTRATION_MODES } from '@/helpers/ens';
import * as ensRedux from '@/redux/ensRegistration';
import { AppState } from '@/redux/store';

export default function useENSRegistration() {
  const { accountAddress } = useAccountSettings();

  const registrationParameters = useSelector(({ ensRegistration }: AppState) => {
    return {
      ...ensRegistration.registrations?.[accountAddress?.toLowerCase()]?.[ensRegistration.currentRegistrationName],
      currentRegistrationName: ensRegistration.currentRegistrationName,
    };
  });

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
  const removeRecordByKey = useCallback((key: string) => dispatch(ensRedux.removeRecordByKey(key)), [dispatch]);
  const startRegistration = useCallback(
    (name: string, mode: keyof typeof REGISTRATION_MODES) => dispatch(ensRedux.startRegistration(name, mode)),
    [dispatch]
  );
  const updateRecordByKey = useCallback((key: string, value: string) => dispatch(ensRedux.updateRecordByKey(key, value)), [dispatch]);
  const updateRecords = useCallback((records: Records) => dispatch(ensRedux.updateRecords(records)), [dispatch]);
  const clearCurrentRegistrationName = useCallback(() => dispatch(ensRedux.clearCurrentRegistrationName()), [dispatch]);

  const removeRegistrationByName = useCallback((name: string) => dispatch(ensRedux.removeRegistrationByName(name)), [dispatch]);

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
