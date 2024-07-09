import React, { memo, useMemo } from 'react';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { Box, Stack, Text } from '@/design-system';
import * as i18n from '@/languages';
import { swapsStore } from '@/state/swaps/swapsStore';
import { isL2Chain } from '@/__swaps__/utils/chains';
import { EXPANDED_INPUT_HEIGHT, FOCUSED_INPUT_HEIGHT } from '../../constants';
import { useSwapContext } from '../../providers/swap-provider';
import { BUY_LIST_HEADER_HEIGHT } from './TokenToBuyList';
import { SELL_LIST_HEADER_HEIGHT } from './TokenToSellList';

type ListEmptyProps = {
  action?: 'swap' | 'bridge';
  output?: boolean;
};

export const ListEmpty = memo(function ListEmpty({ action = 'swap', output = false }: ListEmptyProps) {
  const { inputProgress, outputProgress } = useSwapContext();

  const isL2 = useMemo(() => {
    return output ? isL2Chain(swapsStore.getState().selectedOutputChainId) : false;
  }, [output]);

  const containerHeight = useAnimatedStyle(() => {
    const isFocused = output ? outputProgress.value === 2 : inputProgress.value === 2;
    return {
      height: withTiming(
        (isFocused ? FOCUSED_INPUT_HEIGHT : EXPANDED_INPUT_HEIGHT) - 120 - (output ? BUY_LIST_HEADER_HEIGHT : SELL_LIST_HEADER_HEIGHT),
        TIMING_CONFIGS.slowerFadeConfig
      ),
    };
  });

  return (
    <Box alignItems="center" as={Animated.View} style={[{ alignSelf: 'center', flexDirection: 'row' }, containerHeight]}>
      <Box paddingHorizontal="44px">
        <Stack space="16px">
          <Text containsEmoji color="label" size="26pt" weight="bold" align="center">
            👻
          </Text>

          <Text color="labelTertiary" size="20pt" weight="semibold" align="center">
            {i18n.t(i18n.l.swap.tokens_input.nothing_found)}
          </Text>

          <Text color="labelQuaternary" size="14px / 19px (Deprecated)" weight="regular" align="center">
            {i18n.t(i18n.l.swap.tokens_input[isL2 ? 'nothing_found_description_l2' : 'nothing_found_description'], {
              action,
            })}
          </Text>
        </Stack>
      </Box>
    </Box>
  );
});
