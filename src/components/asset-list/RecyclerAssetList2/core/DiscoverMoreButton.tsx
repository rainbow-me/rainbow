import React, { useCallback } from 'react';

import { analytics } from '@/analytics';
import { TintButton } from '@/components/cards/reusables/TintButton';
import { AccentColorProvider } from '@/design-system';
import { useRemoteConfig } from '@/features/config/stores/remoteConfig';
import { useAccountAccentColor } from '@/hooks/useAccountAccentColor';
import * as i18n from '@/languages';
import { useNavigation } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';

export const DISCOVER_MORE_BUTTON_HEIGHT = 40;

export const DiscoverMoreButton = React.memo(function DiscoverMoreButton() {
  const { navigate } = useNavigation();
  const { accentColor } = useAccountAccentColor();
  const { discover_enabled: discoverEnabled } = useRemoteConfig('discover_enabled');

  const handlePressDiscover = useCallback(() => {
    if (!discoverEnabled) return;

    navigate(Routes.DISCOVER_SCREEN);
    analytics.track(analytics.event.pressedButton, {
      buttonName: 'DiscoverMoreButton',
      action: 'Navigates from WalletScreen to DiscoverHome',
    });
  }, [discoverEnabled, navigate]);

  return (
    <AccentColorProvider color={accentColor}>
      <TintButton height={DISCOVER_MORE_BUTTON_HEIGHT} onPress={handlePressDiscover} width={163}>
        {`􀎬 ${i18n.t(i18n.l.homepage.discover_web3)}`}
      </TintButton>
    </AccentColorProvider>
  );
});
