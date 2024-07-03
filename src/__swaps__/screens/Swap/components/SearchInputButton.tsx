import React, { useCallback } from 'react';
import { GestureHandlerV1Button } from './GestureHandlerV1Button';
import { AnimatedText, Box } from '@/design-system';
import Animated, { SharedValue, runOnJS, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';
import { NavigationSteps, useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import Clipboard from '@react-native-clipboard/clipboard';
import { useSwapsStore } from '@/state/swaps/swapsStore';
import * as i18n from '@/languages';
import { THICK_BORDER_WIDTH } from '../constants';
import { useClipboard } from '@/hooks';

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
      // to prevent users from mistakingly pasting long ass texts when copying the wrong thing
      // we slice the string to 42 which is the size of a eth address,
      // no token name query search should be that big anyway
      const v = text.trim().slice(0, 42);
      pastedSearchInputValue.value = v;
      useSwapsStore.setState({ outputSearchQuery: v });
    });
  }, []);

  const buttonVisibilityStyle = useAnimatedStyle(() => {
    const isInputSearchFocused = inputProgress.value === NavigationSteps.SEARCH_FOCUSED;
    const isOutputSearchFocused = outputProgress.value === NavigationSteps.SEARCH_FOCUSED;

    const isVisible =
      isInputSearchFocused ||
      isOutputSearchFocused ||
      (output && (internalSelectedOutputAsset.value || hasClipboardData)) ||
      (!output && internalSelectedInputAsset.value);

    return {
      display: isVisible ? 'flex' : 'none',
      opacity: isVisible ? 1 : 0,
      pointerEvents: isVisible ? 'auto' : 'none',
    };
  });

  return (
    <Animated.View style={buttonVisibilityStyle}>
      <GestureHandlerV1Button
        onPressJS={() => {
          (output ? outputSearchRef : inputSearchRef).current?.blur();
        }}
        onPressWorklet={() => {
          'worklet';
          if (output && outputProgress.value === NavigationSteps.TOKEN_LIST_FOCUSED && !internalSelectedOutputAsset.value) {
            runOnJS(onPaste)();
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
      </GestureHandlerV1Button>
    </Animated.View>
  );
};
