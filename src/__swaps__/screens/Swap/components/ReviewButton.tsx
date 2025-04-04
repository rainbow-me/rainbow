import React from 'react';
import * as i18n from '@/languages';
import { Box, Text, TextIcon, useColorMode } from '@/design-system';
import { GestureHandlerButton } from './GestureHandlerButton';
import { LIGHT_SEPARATOR_COLOR, SEPARATOR_COLOR, THICK_BORDER_WIDTH } from '../constants';
import { useSwapContext } from '../providers/swap-provider';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

export function ReviewButton() {
  const { isDarkMode } = useColorMode();
  const { SwapNavigation, AnimatedSwapStyles, isFetching } = useSwapContext();

  const disabledWrapper = useAnimatedStyle(() => {
    return {
      pointerEvents: isFetching && isFetching?.value ? 'none' : 'auto',
      opacity: isFetching && isFetching?.value ? 0.6 : 1,
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
            background="surfacePrimary"
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
