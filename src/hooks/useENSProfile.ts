import { differenceWith, isEqual } from 'lodash';
import { useCallback, useEffect, useMemo } from 'react';
import { useQuery } from 'react-query';
import { useDispatch, useSelector } from 'react-redux';
import { useAccountSettings } from '.';
import { ENSRegistrationState, Records } from '@rainbow-me/entities';
import { fetchRecords } from '@rainbow-me/handlers/ens';
import * as ensRedux from '@rainbow-me/redux/ensRegistration';
import { AppState } from '@rainbow-me/redux/store';

export default function useENSProfile({
  setExistingRecordsWhenInEditMode = false,
}: {
  /** When true, an update to `existingRecords` will be triggered when the flow is in "edit mode". */
  setExistingRecordsWhenInEditMode?: boolean;
} = {}) {
  const { accountAddress } = useAccountSettings();

  const {
    mode,
    existingRecords,
    records,
    name,
    registrationParameters,
  } = useSelector(({ ensRegistration }: AppState) => {
    const {
      currentRegistrationName,
      registrations,
    } = ensRegistration as ENSRegistrationState;
    const registrationParameters =
      registrations?.[accountAddress?.toLowerCase()]?.[
        currentRegistrationName
      ] || {};
    const existingRecords = registrationParameters?.existingRecords || {};
    const records = registrationParameters?.records || {};
    const mode = registrationParameters?.mode || {};
    return {
      existingRecords,
      mode,
      name: currentRegistrationName,
      records,
      registrationParameters,
    };
  });

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
    if (
      setExistingRecordsWhenInEditMode &&
      mode === 'edit' &&
      recordsQuery.isSuccess
    ) {
      dispatch(
        ensRedux.setExistingRecords(
          accountAddress,
          recordsQuery.data.records as Records
        )
      );
    }
  }, [
    accountAddress,
    dispatch,
    mode,
    recordsQuery.data?.records,
    recordsQuery.isSuccess,
    setExistingRecordsWhenInEditMode,
  ]);

  // Since `records.avatar` is not a reliable source for an avatar URL
  // (the avatar can be an NFT), then if the avatar is an NFT, we will
  // parse it to obtain the URL.
  const images = useMemo(() => {
    return (
      recordsQuery.data?.images || { avatarUrl: undefined, coverUrl: undefined }
    );
  }, [recordsQuery.data?.images]);

  // Derive the records that should be added or removed from the profile
  // (these should be used for SET_TEXT txns instead of `records` to save
  // gas).
  const changedRecords = useMemo(() => {
    const entriesToChange = differenceWith(
      Object.entries(records),
      Object.entries(existingRecords),
      isEqual
    ) as [keyof Records, string][];
    const changedRecords = entriesToChange.reduce(
      (recordsToAdd: Partial<Records>, [key, value]) => ({
        ...recordsToAdd,
        [key]: value,
      }),
      {}
    );

    const keysToRemove = differenceWith(
      Object.keys(existingRecords),
      Object.keys(records),
      isEqual
    ) as (keyof Records)[];
    const removedRecords = keysToRemove.reduce(
      (recordsToAdd: Partial<Records>, key) => ({
        ...recordsToAdd,
        [key]: '',
      }),
      {}
    );

    return {
      ...changedRecords,
      ...removedRecords,
    };
  }, [existingRecords, records]);

  return {
    changedRecords,
    clearCurrentRegistrationName,
    existingRecords,
    images,
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
