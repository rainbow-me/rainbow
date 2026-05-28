import React, { useEffect } from 'react';

import { useRoute } from '@react-navigation/native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { analytics } from '@/analytics';
import { GenericCard, type Gradient } from '@/components/cards/GenericCard';
import { IconOrb } from '@/components/cards/reusables/IconOrb';
import { enableActionsOnReadOnlyWallet } from '@/config/debug';
import { Box, ColorModeProvider, globalColors, Stack, Text } from '@/design-system';
import { watchingAlert } from '@/features/wallet/utils/watchingAlert';
import * as i18n from '@/languages';
import { useNavigation } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { getIsReadOnlyWallet } from '@/state/wallets/walletsStore';

import useENSPendingRegistrations from '../hooks/useENSPendingRegistrations';
import { REGISTRATION_MODES } from '../utils/helpers';

const TRANSLATIONS = i18n.l.cards.ens_search;
const GRADIENT: Gradient = {
  colors: ['#0E76FD', '#61B5FF'],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 0 },
};

const springConfig = {
  damping: 20,
  mass: 1,
  stiffness: 300,
};

export const ENSSearchCard = () => {
  const { pendingRegistrations } = useENSPendingRegistrations();
  const { navigate } = useNavigation();
  const { name: routeName } = useRoute();
  const cardType = 'square';

  const pendingBadgeProgress = useSharedValue(0);

  useEffect(() => {
    if (pendingRegistrations?.length > 0) {
      // This setTimeout prevents the badge from appearing before the number in the badge is updated.
      setTimeout(() => {
        pendingBadgeProgress.value = withSpring(1, springConfig);
      }, 0);
    } else {
      pendingBadgeProgress.value = withSpring(0, springConfig);
    }
  }, [pendingBadgeProgress, pendingRegistrations?.length]);

  const handlePress = () => {
    if (!getIsReadOnlyWallet() || enableActionsOnReadOnlyWallet) {
      analytics.track(analytics.event.cardPressed, {
        cardName: 'ENSSearchCard',
        routeName,
        cardType,
      });
      navigate(Routes.REGISTER_ENS_NAVIGATOR, {
        mode: REGISTRATION_MODES.SEARCH,
      });
    } else {
      watchingAlert();
    }
  };

  const pendingBadgeStyle = useAnimatedStyle(() => {
    return {
      opacity: 1 * pendingBadgeProgress.value,
      transform: [
        {
          scale: 1 * pendingBadgeProgress.value,
        },
      ],
    };
  }, [pendingRegistrations]);

  const searchIconStyle = useAnimatedStyle(() => {
    return {
      opacity: 1 * (1 - pendingBadgeProgress.value),
      transform: [
        {
          scale: 1 * (1 - pendingBadgeProgress.value),
        },
      ],
    };
  }, [pendingRegistrations]);

  return (
    <GenericCard color={globalColors.blue60} gradient={GRADIENT} onPress={handlePress} testID="ens-register-name-banner" type={cardType}>
      <ColorModeProvider value="darkTinted">
        <Box height="full" justifyContent="space-between" alignItems="flex-start">
          <Box as={Animated.View} style={pendingBadgeStyle}>
            <IconOrb
              borderColor={globalColors.blue10}
              borderWidth={2.5}
              color={globalColors.blue50}
              icon={pendingRegistrations?.length.toString()}
              shadowColor="shadow"
              textSize="20pt"
              textWeight="heavy"
            />
          </Box>
          <Box as={Animated.View} position="absolute" style={searchIconStyle}>
            <IconOrb color={globalColors.blue70} icon="􀊫" shadowColor="shadow" />
          </Box>
          <Stack space="10px">
            <Text color={{ custom: globalColors.blue20 }} size="13pt" weight="bold">
              {i18n.t(TRANSLATIONS.mini_title)}
            </Text>
            <Text color="label" size="20pt" weight="heavy">
              {i18n.t(TRANSLATIONS.title)}
            </Text>
          </Stack>
        </Box>
      </ColorModeProvider>
    </GenericCard>
  );
};
