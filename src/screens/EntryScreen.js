import { useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { isNewOnboardingFlowAvailable } from '../config/experimental';
import { loadAddress } from '../model/wallet';
import Routes from '../navigation/routesNames';

export default function EntryScreen() {
  const { navigate } = useNavigation();
  useEffect(() => {
    const init = async () => {
      if (isNewOnboardingFlowAvailable) {
        const address = await loadAddress();
        if (address) {
          navigate(Routes.SWIPE_LAYOUT);
        } else {
          navigate(Routes.WELCOME_SCREEN);
        }
      } else {
        navigate(Routes.WELCOME_SCREEN);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <React.Fragment />;
}
