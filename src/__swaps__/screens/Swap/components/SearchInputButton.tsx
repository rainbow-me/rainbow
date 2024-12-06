import React, { useCallback } from 'react';
import { GestureHandlerButton } from './GestureHandlerButton';
import { AnimatedText, Box } from '@/design-system';
import Animated, { SharedValue, runOnJS, useAnimatedStyle, useDerivedValue, withTiming } from 'react-native-reanimated';
import { triggerHaptics } from 'react-native-turbo-haptics';
import { NavigationSteps, useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import Clipboard from '@react-native-clipboard/clipboard';
import { useSwapsStore } from '@/state/swaps/swapsStore';
import * as i18n from '@/languages';
import { THICK_BORDER_WIDTH } from '../constants';
import { useClipboard } from '@/hooks';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { IS_ANDROID } from '@/env';

const CANCEL_LABEL = i18n.t(i18n.l.button.cancel);
const CLOSE_LABEL = i18n.t(i18n.l.button.close);
const PASTE_LABEL = i18n.t(i18n.l.button.paste);

export const SearchInputButton = ({
  output,
  pastedSearchInputValue,
  isSearchFocused,
  handleExitSearchWorklet,
}: {
  output: boolean;
  pastedSearchInputValue: SharedValue<string>;
  isSearchFocused: Readonly<SharedValue<boolean>>;
  handleExitSearchWorklet: () => void;
}) => {
  const {
    inputProgress,
    inputSearchRef,
    internalSelectedInputAsset,
    internalSelectedOutputAsset,
    outputProgress,
    outputSearchRef,
    AnimatedSwapStyles,
  } = useSwapContext();

  const { hasClipboardData } = useClipboard();

  const btnText = useDerivedValue(() => {
    if (
      (inputProgress.value === NavigationSteps.SEARCH_FOCUSED && !output) ||
      (outputProgress.value === NavigationSteps.SEARCH_FOCUSED && output)
    ) {
      return CANCEL_LABEL;
    }

    if ((output && internalSelectedOutputAsset.value) || !output) {
      return CLOSE_LABEL;
    }

    return PASTE_LABEL;
  });

  const onPaste = useCallback(() => {
    Clipboard.getString().then(text => {
      // Slice the pasted text to the length of an ETH address
      const v = text.trim().slice(0, 42);
      pastedSearchInputValue.value = v;
      useSwapsStore.setState({ outputSearchQuery: v });
    });
  }, [pastedSearchInputValue]);

  const buttonInfo = useDerivedValue(() => {
    const isInputSearchFocused = inputProgress.value === NavigationSteps.SEARCH_FOCUSED;
    const isOutputSearchFocused = outputProgress.value === NavigationSteps.SEARCH_FOCUSED;
    const isOutputTokenListFocused = outputProgress.value === NavigationSteps.TOKEN_LIST_FOCUSED;

    const clipboardDataAvailable = hasClipboardData || IS_ANDROID;

    const isPasteDisabled = output && !internalSelectedOutputAsset.value && isOutputTokenListFocused && !clipboardDataAvailable;
    const isVisible = isInputSearchFocused || isOutputSearchFocused || output || (!output && !!internalSelectedInputAsset.value);
    const visibleOpacity = isPasteDisabled ? 0.4 : 1;

    return {
      isPasteDisabled,
      isVisible,
      visibleOpacity,
    };
  });

  const buttonVisibilityStyle = useAnimatedStyle(() => {
    return {
      display: buttonInfo.value.isVisible ? 'flex' : 'none',
      opacity: buttonInfo.value.isVisible ? withTiming(buttonInfo.value.visibleOpacity, TIMING_CONFIGS.tabPressConfig) : 0,
      pointerEvents: buttonInfo.value.isVisible ? 'auto' : 'none',
    };
  });

  return (
    <Animated.View style={buttonVisibilityStyle}>
      <GestureHandlerButton
        onPressJS={() => {
          (output ? outputSearchRef : inputSearchRef).current?.blur();
        }}
        onPressWorklet={() => {
          'worklet';
          if (output && outputProgress.value === NavigationSteps.TOKEN_LIST_FOCUSED && !internalSelectedOutputAsset.value) {
            if (buttonInfo.value.isPasteDisabled) {
              triggerHaptics('notificationError');
            } else {
              runOnJS(onPaste)();
            }
          }

          if (isSearchFocused.value || (output && internalSelectedOutputAsset.value) || (!output && internalSelectedInputAsset.value)) {
            handleExitSearchWorklet();
          }
        }}
        scaleTo={0.8}
      >
        <Box
          as={Animated.View}
          alignItems="center"
          borderRadius={18}
          height={{ custom: 36 }}
          justifyContent="center"
          paddingHorizontal={{ custom: 12 - THICK_BORDER_WIDTH }}
          style={[
            output ? AnimatedSwapStyles.searchOutputAssetButtonWrapperStyle : AnimatedSwapStyles.searchInputAssetButtonWrapperStyle,
            {
              borderCurve: 'continuous',
              borderWidth: THICK_BORDER_WIDTH,
              overflow: 'hidden',
            },
          ]}
        >
          <AnimatedText
            align="center"
            style={output ? AnimatedSwapStyles.searchOutputAssetButtonStyle : AnimatedSwapStyles.searchInputAssetButtonStyle}
            size="17pt"
            weight="heavy"
          >
            {btnText}
          </AnimatedText>
        </Box>
      </GestureHandlerButton>
    </Animated.View>
  );
};
