import React from 'react';
import { Bleed, Box, Text } from '@/design-system';
import { SwapDetailsLabel } from './SwapDetailsRow';
import { ButtonPressAnimation } from '@/components/animations';
import { Reward } from '@rainbow-me/swaps';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { ChainBadge } from '@/components/coin-icon';
import { getNetworkObj } from '@/networks';
import { Network } from '@/networks/types';
import { useTheme } from '@/theme';
import * as i18n from '@/languages';

export function SwapDetailsRewardRow({ reward }: { reward: Reward }) {
  const { navigate } = useNavigation();
  const { isDarkMode } = useTheme();

  const roundedAmount = Math.round(reward.amount * 1000) / 1000;

  const opNetwork = getNetworkObj(Network.optimism);
  const accentColor = isDarkMode ? opNetwork.colors.dark : opNetwork.colors.light;

  return (
    <Box flexDirection="row" alignItems="center" justifyContent="space-between">
      <ButtonPressAnimation onPress={() => navigate(Routes.OP_REWARDS_SHEET)}>
        <SwapDetailsLabel>{i18n.t(i18n.l.expanded_state.swap_details.reward)} 􀅵</SwapDetailsLabel>
      </ButtonPressAnimation>
      <Bleed vertical="10px">
        <Box
          flexDirection="row"
          alignItems="center"
          paddingLeft="4px"
          paddingRight="8px"
          paddingVertical="4px"
          borderRadius={20}
          style={{
            borderWidth: 1.5,
            borderColor: accentColor + '0F',
            gap: 5,
          }}
        >
          <ChainBadge network={Network.optimism} position="relative" />
          <Text align="center" size="14px / 19px (Deprecated)" weight="bold" color={{ custom: accentColor }}>
            {roundedAmount || '<0.001'} {reward.token.symbol}
          </Text>
        </Box>
      </Bleed>
    </Box>
  );
}
