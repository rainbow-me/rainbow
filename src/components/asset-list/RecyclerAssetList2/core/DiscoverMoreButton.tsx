import { AccentColorProvider } from '@/design-system';
import { useNavigation } from '@/navigation';
import React, { useCallback } from 'react';
import Routes from '@/navigation/routesNames';
import { useAccountAccentColor } from '@/hooks/useAccountAccentColor';
import { TintButton } from '@/components/cards/reusables/TintButton';
import { analytics } from '@/analytics';
import * as i18n from '@/languages';

export const DISCOVER_MORE_BUTTON_HEIGHT = 40;

export const DiscoverMoreButton = React.memo(function DiscoverMoreButton() {
  const { navigate } = useNavigation();
  const { accentColor } = useAccountAccentColor();

  const handlePressDiscover = useCallback(() => {
    navigate(Routes.DISCOVER_SCREEN);
    analytics.track(analytics.event.pressedButton, {
      buttonName: 'DiscoverMoreButton',
      action: 'Navigates from WalletScreen to DiscoverHome',
    });
  }, [navigate]);

  return (
    <AccentColorProvider color={accentColor}>
      <TintButton height={DISCOVER_MORE_BUTTON_HEIGHT} onPress={handlePressDiscover} width={163}>
        {`􀎬 ${i18n.t(i18n.l.homepage.discover_web3)}`}
      </TintButton>
    </AccentColorProvider>
  );
});
