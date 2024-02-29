import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { fetchENSRecords } from './useENSRecords';
import useWallets from './useWallets';
import { analyticsV2 } from '@/analytics';
import { EthereumAddress } from '@/entities';
import { fetchAccountDomains } from '@/handlers/ens';
import { ENS_RECORDS } from '@/helpers/ens';
import walletTypes from '@/helpers/walletTypes';
import { RainbowWallet } from '@/model/wallet';

export default function useTrackENSProfile() {
  const { walletNames, wallets } = useWallets();

  const addresses = useMemo(
    () =>
      Object.values<RainbowWallet | undefined>(wallets || {})
        .filter(wallet => wallet?.type !== walletTypes.readOnly)
        .reduce(
          (addresses: EthereumAddress[], wallet: RainbowWallet | undefined) =>
            addresses.concat(wallet?.addresses.map(({ address }: { address: EthereumAddress }) => address)!),
          []
        ),
    [wallets]
  );

  const getTrackProfilesData = useCallback(async () => {
    const data = {
      numberOfENSOwned: 0,
      numberOfENSWithAvatarOrCoverSet: 0,
      numberOfENSWithOtherMetadataSet: 0,
      numberOfENSWithPrimaryNameSet: 0,
    };
    for (const i in addresses) {
      const ens = walletNames[addresses[i]];
      if (ens) {
        const { records } = await fetchENSRecords(ens);
        const domains = await fetchAccountDomains(addresses[i]);
        data.numberOfENSOwned += domains?.account?.registrations?.length || 0;
        data.numberOfENSWithAvatarOrCoverSet += records?.avatar || records?.header ? 1 : 0;

        data.numberOfENSWithOtherMetadataSet = Object.keys(records ?? {}).some(
          key => key !== ENS_RECORDS.header && key !== ENS_RECORDS.avatar
        )
          ? 1
          : 0;
        data.numberOfENSWithPrimaryNameSet += 1;
      }
    }
    return data;
  }, [addresses, walletNames]);

  const { data, isSuccess } = useQuery(['getTrackProfilesData', [addresses]], getTrackProfilesData, {
    enabled: Boolean(addresses.length),
    retry: 0,
  });

  const trackENSProfile = useCallback(() => {
    isSuccess && data && analyticsV2.identify(data);
  }, [isSuccess, data]);

  return { trackENSProfile };
}
