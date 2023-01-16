import React from 'react';
import { GenericCard } from '@/components/cards/GenericCard';
import { Box, Cover, globalColors, Stack, Text } from '@/design-system';
import { ButtonPressAnimation } from '@/components/animations';
import { Image, StyleSheet } from 'react-native';
import OpRewardsCardBackgroundImage from '../../assets/opRewardsCardBackgroundImage.png';
import { useTheme } from '@/theme';
import * as i18n from '@/languages';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';

const GRADIENT = ['#520907', '#B22824'];

export const OpRewardsCard: React.FC = () => {
  const { colors } = useTheme();
  const { navigate } = useNavigation();

  const navigateToRewardsSheet = () => {
    navigate(Routes.OP_REWARDS_SHEET);
  };

  return (
    <GenericCard
      type="stretch"
      gradient={GRADIENT}
      onPress={navigateToRewardsSheet}
      color={colors.networkColors.optimism}
    >
      <Cover>
        <Box
          as={Image}
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
          <Text
            color={{ custom: colors.networkColors.optimism }}
            size="20pt"
            weight="heavy"
          >
            {i18n.t(i18n.l.discover.op_rewards.card_title)}
          </Text>
          <Box width="4/5">
            <Text
              size="15pt / 135%"
              color={{ custom: globalColors.white100 }}
              weight="bold"
            >
              {i18n.t(i18n.l.discover.op_rewards.card_subtitle)}
            </Text>
          </Box>
        </Stack>
        <ButtonPressAnimation onPress={navigateToRewardsSheet} scaleTo={0.96}>
          <Box
            height="36px"
            style={{ backgroundColor: colors.networkColors.optimism }}
            borderRadius={18}
            justifyContent="center"
            alignItems="center"
          >
            <Text size="15pt" weight="bold" color={{ custom: '#520907' }}>
              {i18n.t(i18n.l.discover.op_rewards.button_title)}
            </Text>
          </Box>
        </ButtonPressAnimation>
      </Stack>
    </GenericCard>
  );
};
