import { differenceWith, isEqual } from 'lodash';
import { useCallback, useEffect, useMemo } from 'react';
import { useQuery } from 'react-query';
import { useDispatch, useSelector } from 'react-redux';
import { useAccountSettings } from '.';
import { ENSRegistrationState, Records } from '@rainbow-me/entities';
import { fetchProfile } from '@rainbow-me/handlers/ens';
import * as ensRedux from '@rainbow-me/redux/ensRegistration';
import { AppState } from '@rainbow-me/redux/store';
import { isENSNFTAvatar, parseENSNFTAvatar } from '@rainbow-me/utils';

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

  const recordsQuery = useQuery(['records', name], () => fetchProfile(name), {
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
      setInitialRecordsWhenInEditMode &&
      mode === 'edit' &&
      recordsQuery.isSuccess
    ) {
      dispatch(
        ensRedux.setInitialRecords(
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
    setInitialRecordsWhenInEditMode,
  ]);

  // Since `records.avatar` is not a reliable source for an avatar URL
  // (the avatar can be an NFT), then if the avatar is an NFT, we will
  // parse it to obtain the URL.
  const uniqueTokens = useSelector(
    ({ uniqueTokens }: AppState) => uniqueTokens.uniqueTokens
  );
  const images = useMemo(() => {
    let avatarUrl = recordsQuery.data?.images?.avatarUrl;
    let coverUrl = recordsQuery.data?.images?.coverUrl;

    if (records.avatar) {
      const isNFTAvatar = isENSNFTAvatar(records.avatar);
      if (isNFTAvatar) {
        const { contractAddress, tokenId } = parseENSNFTAvatar(records?.avatar);
        const uniqueToken = uniqueTokens.find(
          token =>
            token.asset_contract.address === contractAddress &&
            token.id === tokenId
        );
        if (uniqueToken?.image_thumbnail_url) {
          avatarUrl = uniqueToken?.image_thumbnail_url;
        }
      }
    }

    return {
      avatarUrl,
      coverUrl,
    };
  }, [
    records.avatar,
    recordsQuery.data?.images?.avatarUrl,
    recordsQuery.data?.images?.coverUrl,
    uniqueTokens,
  ]);

  // Derive the records that should be added or removed from the profile
  // (these should be used for SET_TEXT txns instead of `records` to save
  // gas).
  const changedRecords = useMemo(() => {
    const entriesToChange = differenceWith(
      Object.entries(records),
      Object.entries(initialRecords),
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
      Object.keys(initialRecords),
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
  }, [initialRecords, records]);
  useEffect(() => {
    dispatch(ensRedux.setChangedRecords(accountAddress, changedRecords));
  }, [accountAddress, changedRecords, dispatch]);

  return {
    changedRecords,
    clearCurrentRegistrationName,
    images,
    initialRecords,
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
