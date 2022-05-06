import analytics from '@segment/analytics-react-native';
import { useCallback, useEffect, useMemo } from 'react';
import { useQuery } from 'react-query';
import useWallets from './useWallets';
import { EthereumAddress } from '@rainbow-me/entities';
import {
  fetchAccountRegistrations,
  fetchProfile,
} from '@rainbow-me/handlers/ens';
import { ENS_RECORDS } from '@rainbow-me/helpers/ens';
import walletTypes from '@rainbow-me/helpers/walletTypes';

export default function useTrackENSProfile() {
  const { walletNames, wallets } = useWallets();

  const addresses = useMemo(
    () =>
      Object.values(wallets || {})
        .filter((wallet: any) => wallet?.type !== walletTypes.readOnly)
        .reduce(
          (addresses: EthereumAddress[], wallet: any) =>
            addresses.concat(
              wallet?.addresses.map(
                ({ address }: { address: EthereumAddress }) => address
              )
            ),
          []
        ),
    [wallets]
  );

  const getTrackProfilesData = useCallback(async () => {
    const data = {
      avatarOrCoverSet: false,
      isPrimaryNameSet: false,
      namesOwned: 0,
      otherMetadataSet: false,
    };
    for (const i in addresses) {
      const ens = walletNames[addresses[i]];
      if (ens) {
        const profile = await fetchProfile(ens);
        const registrations = await fetchAccountRegistrations(addresses[i]);
        data.namesOwned +=
          registrations?.data?.account?.registrations?.length || 0;
        const avatarOrCoverSet = Boolean(
          profile?.records?.avatar || profile?.records?.cover
        );
        const otherMetadataSet = Object.keys(profile?.records).some(
          key => key !== ENS_RECORDS.cover && key !== ENS_RECORDS.avatar
        );
        data.isPrimaryNameSet = true;
        if (!data.avatarOrCoverSet) data.avatarOrCoverSet = avatarOrCoverSet;
        if (!data.otherMetadataSet) data.otherMetadataSet = otherMetadataSet;
      }
    }
    return data;
  }, [addresses, walletNames]);

  const { data, isSuccess } = useQuery(
    ['getTrackProfilesData', [addresses]],
    getTrackProfilesData,
    { enabled: Boolean(addresses.length), retry: 0 }
  );

  useEffect(() => {
    if (isSuccess) {
      console.log('😬😬😬😬😬😬 IDENTIFY', data);
    }
  }, [data, isSuccess]);

  const trackENSProfile = useCallback(async () => {
    analytics.identify(null, data);
  }, [data]);

  return { trackENSProfile };
}
