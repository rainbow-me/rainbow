import useAccountSettings from './useAccountSettings';
import { fetchProfile } from '@rainbow-me/handlers/ens';
import analytics from '@segment/analytics-react-native';
import { useSelector } from 'react-redux';
import { ENSRegistrationState } from '@rainbow-me/entities';
import { AppState } from '@rainbow-me/redux/store';
import useWallets from './useWallets';
import { useCallback } from 'react';

export default function useTrackENSProfile() {
  const { accountAddress } = useAccountSettings();
  const { walletNames } = useWallets();

  const ens = walletNames[accountAddress];

  const createdInRainbow = useSelector(({ ensRegistration }: AppState) => {
    const { registrations } = ensRegistration as ENSRegistrationState;
    const currentRegistration =
      registrations?.[accountAddress.toLowerCase()]?.[ens];
    return Boolean(
      currentRegistration?.commitTransactionHash &&
        currentRegistration?.registerTransactionHash
    );
  });

  const trackENSProfile = useCallback(async () => {
    console.log('is it working');

    const profile = await fetchProfile(ens);

    console.log({
      createdInRainbow: createdInRainbow,
      ownerAddress: accountAddress,
      name: ens,
      data: JSON.stringify(profile),
    });
    analytics.identify(null, {
      ensProfile: {
        createdInRainbow: createdInRainbow,
        ownerAddress: accountAddress,
        name: ens,
        data: JSON.stringify(profile),
      },
    });
  }, [accountAddress, createdInRainbow, walletNames]);

  return { trackENSProfile };
}
