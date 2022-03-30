import analytics from '@segment/analytics-react-native';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import useAccountSettings from './useAccountSettings';
import useWallets from './useWallets';
import { ENSRegistrationState } from '@rainbow-me/entities';
import { fetchProfile } from '@rainbow-me/handlers/ens';
import { AppState } from '@rainbow-me/redux/store';

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
    const profile = await fetchProfile(ens);
    const data = JSON.parse(
      JSON.stringify({
        ensProfile: { ...{ createdInRainbow: createdInRainbow }, ...profile },
      })
    );
    analytics.identify(null, data);
  }, [createdInRainbow, ens]);

  return { trackENSProfile };
}
