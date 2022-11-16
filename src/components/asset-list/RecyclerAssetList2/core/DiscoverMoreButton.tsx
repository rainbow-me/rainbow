import { AccentColorProvider } from '@/design-system';
import { useNavigation } from '@/navigation';
import React, { useCallback } from 'react';
import Routes from '@/navigation/routesNames';
import { useAccountAccentColor } from '@/hooks/useAccountAccentColor';
import { TintButton } from '@/components/cards/reusables/TintButton';
import { analytics } from '@/analytics';
import lang from 'i18n-js';

export const DiscoverMoreButtonHeight = 40;

export const DiscoverMoreButton = () => {
  const { navigate } = useNavigation();
  const { accentColor } = useAccountAccentColor();

  const handlePressDiscover = useCallback(() => {
    navigate(Routes.DISCOVER_SCREEN);
    analytics.track('DiscoverMoreButton pressed');
  }, [navigate]);

  return (
    <AccentColorProvider color={accentColor}>
      <TintButton
        height={DiscoverMoreButtonHeight}
        onPress={handlePressDiscover}
        width={163}
      >
        {`􀎬 ${lang.t('homepage.discover_web3')}`}
      </TintButton>
    </AccentColorProvider>
  );
};
