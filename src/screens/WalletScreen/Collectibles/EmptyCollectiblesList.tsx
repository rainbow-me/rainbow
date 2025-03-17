import React, { useCallback } from 'react';
import { Animated } from 'react-native';
import { Stack, Box, Text, useColorMode } from '@/design-system';
import * as i18n from '@/languages';

import { MINTS, NFTS_ENABLED } from '@/config/experimental';

import { useExperimentalFlag } from '@/config';
import { useRemoteConfig } from '@/model/remoteConfig';
import { analyticsV2 } from '@/analytics';
import { useNavigation } from '@/navigation';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import Routes from '@/navigation/routesNames';
import { LIGHT_SEPARATOR_COLOR, SEPARATOR_COLOR } from '@/__swaps__/screens/Swap/constants';
import { LoadingCollectiblesList } from './LoadingCollectiblesList';

const NavigateToMintsSheetButton = () => {
  const { navigate } = useNavigation();
  const { isDarkMode } = useColorMode();

  const handlePress = useCallback(() => {
    analyticsV2.track(analyticsV2.event.mintsPressedViewAllMintsButton);
    navigate(Routes.MINTS_SHEET);
  }, []);

  return (
    <Box style={{ alignItems: 'center', paddingTop: 12 }}>
      <GestureHandlerButton onPressJS={handlePress} scaleTo={0.9}>
        <Box as={Animated.View} alignItems="center" justifyContent="center" paddingHorizontal="12px" paddingVertical="6px">
          <Box
            alignItems="center"
            as={Animated.View}
            borderRadius={15}
            justifyContent="center"
            paddingVertical="12px"
            paddingHorizontal="20px"
            style={[{ backgroundColor: isDarkMode ? SEPARATOR_COLOR : LIGHT_SEPARATOR_COLOR }]}
          >
            <Text size="13pt" color={'label'} style={{ opacity: isDarkMode ? 0.6 : 0.75 }} weight="heavy">
              {i18n.t(i18n.l.nfts.collect_now)}
            </Text>
          </Box>
        </Box>
      </GestureHandlerButton>
    </Box>
  );
};

export function EmptyCollectiblesList({ isLoading }: { isLoading: boolean }) {
  const { mints_enabled, nfts_enabled } = useRemoteConfig();

  const nftsEnabled = useExperimentalFlag(NFTS_ENABLED) || nfts_enabled;
  const mintsEnabled = useExperimentalFlag(MINTS) || mints_enabled;

  if (!nftsEnabled) return null;

  if (isLoading) {
    return <LoadingCollectiblesList />;
  }

  return (
    <Box paddingHorizontal="44px" paddingVertical="24px">
      <Stack space="16px">
        <Text containsEmoji color="label" size="26pt" weight="bold" align="center">
          🌟
        </Text>

        <Text color="labelTertiary" size="20pt" weight="semibold" align="center">
          {i18n.t(i18n.l.nfts.empty)}
        </Text>

        <Text color="labelQuaternary" size="14px / 19px (Deprecated)" weight="regular" align="center">
          {i18n.t(i18n.l.nfts.will_appear_here)}
        </Text>

        {mintsEnabled && <NavigateToMintsSheetButton />}
      </Stack>
    </Box>
  );
}
