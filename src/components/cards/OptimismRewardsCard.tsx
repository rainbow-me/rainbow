import React from 'react';
import { GenericCard } from '@/components/cards/GenericCard';
import { Box, Cover, Stack, Text } from '@/design-system';
import { ButtonPressAnimation } from '@/components/animations';
import { Image } from 'react-native';
import OpRewardsCardOverlay from '../../assets/optimismRewardsCardOverlay.png';
import { useTheme } from '@/theme';
import * as i18n from '@/languages';

const GRADIENT = ['#520907', '#B22824'];

export const OptimismRewardsCard: React.FC = () => {
  const { colors } = useTheme();
  return (
    <GenericCard type="stretch" gradient={GRADIENT} onPress={() => {}}>
      <Cover>
        <Image
          source={OpRewardsCardOverlay}
          resizeMode="cover"
          style={{
            width: '100%',
            overflow: 'hidden',
            height: '100%',
            borderRadius: 20,
          }}
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
              color={{ custom: '#FFFFFF' }}
              weight="bold"
            >
              {i18n.t(i18n.l.discover.op_rewards.card_subtitle)}
            </Text>
          </Box>
        </Stack>
        <ButtonPressAnimation onPress={() => {}} scaleTo={0.96}>
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
