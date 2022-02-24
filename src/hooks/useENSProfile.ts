import { useCallback, useEffect, useMemo } from 'react';
import { useQuery } from 'react-query';
import { useDispatch, useSelector } from 'react-redux';
import { useAccountSettings } from '.';
import { ENSRegistrationState, Records } from '@rainbow-me/entities';
import { fetchRecords } from '@rainbow-me/handlers/ens';
import * as ensRedux from '@rainbow-me/redux/ensRegistration';
import { AppState } from '@rainbow-me/redux/store';
import { isENSNFTAvatar, parseENSNFTAvatar } from '@rainbow-me/utils';

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

  // Since `records.avatar` is not a reliable source for an avatar URL
  // (the avatar can be an NFT), then if the avatar is an NFT, we will
  // parse it to obtain the URL.
  const uniqueTokens = useSelector(
    ({ uniqueTokens }: AppState) => uniqueTokens.uniqueTokens
  );
  const avatarUrl = useMemo(() => {
    if (records.avatar) {
      const isNFTAvatar = isENSNFTAvatar(records.avatar);
      if (isNFTAvatar) {
        const { contractAddress, tokenId } = parseENSNFTAvatar(records.avatar);
        const uniqueToken = uniqueTokens.find(
          token =>
            token.asset_contract.address === contractAddress &&
            token.id === tokenId
        );
        return uniqueToken?.image_thumbnail_url;
      }
    }
    return records.avatar;
  }, [records.avatar, uniqueTokens]);

  return {
    avatarUrl,
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
