import { uniq } from 'lodash';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useSelector } from 'react-redux';

import {
  getHiddenTokens,
  saveHiddenTokens,
} from '../../handlers/localstorage/accountLocal';
import {
  PreferenceActionType,
  PreferencesResponse,
  getPreference as rawGetPreference,
  setPreference as rawSetPreference,
} from '../../model/preferences';
import useAccountSettings from '../useAccountSettings';

export function createHiddenTokensQueryKeys({
  ethereumAddress,
  ethereumNetwork,
}: {
  ethereumAddress: string;
  ethereumNetwork: string;
}) {
  return [
    'accountPreferences',
    ethereumAddress,
    ethereumNetwork,
    'hiddenTokens',
  ];
}

/**
 * Set the hidden tokens for a given account on a given network.
 */
export function useMutationHiddenTokens() {
  const queryClient = useQueryClient();
  const { network, accountAddress } = useAccountSettings();
  // @ts-expect-error
  const isWebDataEnabled = useSelector(
    state => state?.showcaseTokens?.webDataEnabled
  );

  return useMutation(async (hiddenTokens: string[]) => {
    const localCachedData =
      (await getHiddenTokens(accountAddress, network)) ?? [];
    const uniqueTokens = uniq([...hiddenTokens, ...localCachedData]);

    console.log({ isWebDataEnabled, uniqueTokens })

    if (isWebDataEnabled) {
      // TODO only for mainnet? When should we expand to include other
      // networks?
      // await rawSetPreference(
      //   PreferenceActionType.update,
      //   'hidden',
      //   accountAddress,
      //   uniqueTokens
      // );
    }

    // always save locally
    saveHiddenTokens(uniqueTokens, accountAddress, network);

    // always make sure subsequent requests re-fetch fresh data
    await queryClient.invalidateQueries(
      createHiddenTokensQueryKeys({
        ethereumAddress: accountAddress,
        ethereumNetwork: network,
      })
    );
  });
}

/**
 * Get the tokens hidden by a given account on a given network.
 */
export function useQueryHiddenTokens() {
  const { network, accountAddress } = useAccountSettings();
  // @ts-expect-error
  const isWebDataEnabled = useSelector(
    state => state?.showcaseTokens?.webDataEnabled
  );

  return useQuery<string[]>(
    createHiddenTokensQueryKeys({
      ethereumAddress: accountAddress,
      ethereumNetwork: network,
    }),
    async () => {
      const localCachedData = getHiddenTokens(accountAddress, network) ?? [];

      if (isWebDataEnabled) {
        try {
          const res = (await rawGetPreference(
            'hidden',
            accountAddress
          )) as PreferencesResponse;

          if (!res || !res?.success) return localCachedData;

          // @ts-expect-error
          return res?.data?.hidden ?? localCachedData;
        } catch (e) {
          return localCachedData;
        }
      } else {
        return localCachedData;
      }
    }
  );
}
