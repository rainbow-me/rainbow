import React from 'react';
import { getSoftMenuBarHeight } from 'react-native-extra-dimensions-android';

import { Box, Column, Columns, Separator, useColorMode } from '@/design-system';
import { safeAreaInsetValues } from '@/utils';

import { SwapActionButton } from '../../components/SwapActionButton';
import { GasButton } from '../../components/GasButton';
import { LIGHT_SEPARATOR_COLOR, SEPARATOR_COLOR, THICK_BORDER_WIDTH } from '../../constants';
import { opacity } from '../../utils/swaps';
import { IS_ANDROID } from '@/env';
import { useSwapContext } from '../../providers/swap-provider';
import Animated from 'react-native-reanimated';

export function SwapActions() {
  const { isDarkMode } = useColorMode();
  const { confirmButtonIcon, confirmButtonIconStyle, confirmButtonLabel, SwapInputController } = useSwapContext();
  return (
    <Box
      as={Animated.View}
      paddingBottom={{
        custom: IS_ANDROID ? getSoftMenuBarHeight() - 24 : safeAreaInsetValues.bottom + 16,
      }}
      paddingHorizontal="20px"
      paddingTop={{ custom: 16 - THICK_BORDER_WIDTH }}
      style={{
        backgroundColor: opacity(SwapInputController.bottomColor.value, 0.03),
        borderTopColor: opacity(SwapInputController.bottomColor.value, 0.04),
        borderTopWidth: THICK_BORDER_WIDTH,
      }}
      width="full"
    >
      <Columns alignVertical="center" space="12px">
        <Column width="content">
          <GasButton />
        </Column>
        <Column width="content">
          <Box height={{ custom: 32 }}>
            <Separator color={{ custom: isDarkMode ? SEPARATOR_COLOR : LIGHT_SEPARATOR_COLOR }} direction="vertical" thickness={1} />
          </Box>
        </Column>
        <SwapActionButton
          color={SwapInputController.bottomColor.value}
          icon={confirmButtonIcon}
          iconStyle={confirmButtonIconStyle}
          label={confirmButtonLabel}
          scaleTo={0.9}
        />
      </Columns>
    </Box>
  );
}
