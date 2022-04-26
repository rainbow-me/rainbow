import { differenceWith, isEqual } from 'lodash';
import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAccountSettings, useENSProfile } from '.';
import { ENSRegistrationState, Records } from '@rainbow-me/entities';
import { REGISTRATION_MODES } from '@rainbow-me/helpers/ens';
import * as ensRedux from '@rainbow-me/redux/ensRegistration';
import { AppState } from '@rainbow-me/redux/store';

export default function useENSRegistration({
  setInitialRecordsWhenInEditMode = false,
}: {
  /** When true, an update to `initialRecords` will be triggered when the flow is in "edit mode". */
  setInitialRecordsWhenInEditMode?: boolean;
} = {}) {
  const { accountAddress } = useAccountSettings();

  const {
    mode,
    name,
    initialRecords,
    records,
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
    const initialRecords = registrationParameters?.initialRecords || {};
    const records = registrationParameters?.records || {};
    const mode = registrationParameters?.mode || {};
    return {
      initialRecords,
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

  const profileQuery = useENSProfile(name, {
    enabled: mode === REGISTRATION_MODES.EDIT,
  });

  const images = useMemo(() => {
    return {
      avatarUrl: profileQuery?.data?.images?.avatarUrl,
      coverUrl: profileQuery?.data?.images?.coverUrl,
    };
  }, [profileQuery.data?.images.avatarUrl, profileQuery.data?.images.coverUrl]);

  // Derive the records that should be added or removed from the profile
  const changedRecords = useMemo(() => {
    const entriesToChange = differenceWith(
      Object.entries(records),
      Object.entries(initialRecords),
      isEqual
    ) as [keyof Records, string][];

    const changedRecords = entriesToChange.reduce(
      (recordsToAdd: Partial<Records>, [key, value]) => ({
        ...recordsToAdd,
        ...(value ? { [key]: value } : {}),
      }),
      {}
    );

    const recordKeysWithValue = (Object.keys(
      records
    ) as (keyof Records)[]).filter((key: keyof Records) => {
      return Boolean(records[key]);
    });

    const keysToRemove = differenceWith(
      Object.keys(initialRecords),
      recordKeysWithValue,
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
  }, [initialRecords, records]);

  useEffect(() => {
    dispatch(ensRedux.setChangedRecords(accountAddress, changedRecords));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountAddress, JSON.stringify(changedRecords), dispatch]);

  useEffect(() => {
    if (
      setInitialRecordsWhenInEditMode &&
      mode === REGISTRATION_MODES.EDIT &&
      profileQuery.isSuccess
    ) {
      dispatch(
        ensRedux.setInitialRecords(
          accountAddress,
          profileQuery.data?.records as Records
        )
      );
    }
  }, [
    accountAddress,
    dispatch,
    mode,
    profileQuery.data?.records,
    profileQuery.isSuccess,
    setInitialRecordsWhenInEditMode,
  ]);

  return {
    changedRecords,
    clearCurrentRegistrationName,
    images,
    initialRecords,
    mode,
    name,
    profileQuery,
    records,
    registrationParameters,
    removeRecordByKey,
    removeRegistrationByName,
    startRegistration,
    updateRecordByKey,
    updateRecords,
  };
}
