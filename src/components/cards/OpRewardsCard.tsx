import React from 'react';
import { GenericCard, Gradient } from './GenericCard';
import { AccentColorProvider, Box, Cover, globalColors, Stack, Text, useColorMode } from '@/design-system';
import { ButtonPressAnimation } from '@/components/animations';
import { ImageBackground } from 'react-native';
import OpRewardsCardBackgroundImage from '../../assets/opRewardsCardBackgroundImage.png';
import * as i18n from '@/languages';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { ChainId } from '@/state/backendNetworks/types';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';

const GRADIENT: Gradient = {
  colors: ['#520907', '#B22824'],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 0 },
};

export const OpRewardsCard: React.FC = () => {
  const { navigate } = useNavigation();
  const { isDarkMode } = useColorMode();

  const color = useBackendNetworksStore.getState().getColorsForChainId(ChainId.optimism, isDarkMode);

  const navigateToRewardsSheet = () => {
    navigate(Routes.OP_REWARDS_SHEET);
  };

  return (
    <AccentColorProvider color={color}>
      <GenericCard type="stretch" gradient={GRADIENT} onPress={navigateToRewardsSheet} color="accent">
        <Cover>
          <Box
            as={ImageBackground}
            source={OpRewardsCardBackgroundImage}
            resizeMode="cover"
            width="full"
            height="full"
            borderRadius={20}
            overflow="hidden"
          />
        </Cover>
        <Stack space="32px">
          <Stack space="10px">
            <Text color="accent" size="20pt" weight="heavy">
              {i18n.t(i18n.l.discover.op_rewards.card_title)}
            </Text>
            <Box width="4/5">
              <Text size="15pt / 135%" color={{ custom: globalColors.white100 }} weight="bold">
                {i18n.t(i18n.l.discover.op_rewards.card_subtitle)}
              </Text>
            </Box>
          </Stack>
          <ButtonPressAnimation onPress={navigateToRewardsSheet} scaleTo={0.96}>
            <Box height="36px" background="accent" borderRadius={18} justifyContent="center" alignItems="center">
              <Text size="15pt" weight="bold" color={{ custom: globalColors.white100 }}>
                {i18n.t(i18n.l.discover.op_rewards.button_title)}
              </Text>
            </Box>
          </ButtonPressAnimation>
        </Stack>
      </GenericCard>
    </AccentColorProvider>
  );
};
