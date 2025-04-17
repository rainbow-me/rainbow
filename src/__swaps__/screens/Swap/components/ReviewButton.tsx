import React from 'react';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { Box, Text, TextIcon, useColorMode } from '@/design-system';
import * as i18n from '@/languages';
import { GestureHandlerButton } from './GestureHandlerButton';
import { LIGHT_SEPARATOR_COLOR, SEPARATOR_COLOR, THICK_BORDER_WIDTH } from '../constants';
import { useSwapContext } from '../providers/swap-provider';

export function ReviewButton() {
  const { isDarkMode } = useColorMode();
  const { AnimatedSwapStyles, SwapNavigation, confirmButtonProps, isFetching } = useSwapContext();

  const disabledWrapper = useAnimatedStyle(() => {
    const shouldDisable = isFetching.value || confirmButtonProps.value.disabled;
    return {
      pointerEvents: shouldDisable ? 'none' : 'auto',
      opacity: shouldDisable ? 0.4 : 1,
    };
  });

  return (
    <Animated.View style={disabledWrapper}>
      <GestureHandlerButton
        onPressWorklet={() => {
          'worklet';
          SwapNavigation.handleShowReview();
        }}
        scaleTo={0.9}
      >
        <Box as={Animated.View} alignItems="center" justifyContent="center" style={AnimatedSwapStyles.hideWhenInputsExpanded}>
          <Box
            alignItems="center"
            justifyContent="center"
            flexDirection="row"
            height={30}
            paddingHorizontal={'10px'}
            borderRadius={15}
            gap={4}
            style={[{ borderColor: isDarkMode ? SEPARATOR_COLOR : LIGHT_SEPARATOR_COLOR, borderWidth: THICK_BORDER_WIDTH }]}
          >
            <TextIcon color="labelQuaternary" size="icon 13px" weight="heavy">
              {'􀕹'}
            </TextIcon>
            <Text color="labelQuaternary" size="13pt" weight="heavy">
              {i18n.t(i18n.l.swap.actions.review)}
            </Text>
          </Box>
        </Box>
      </GestureHandlerButton>
    </Animated.View>
  );
}
