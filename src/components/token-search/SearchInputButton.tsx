import React, { useCallback } from 'react';
import { type TextInput } from 'react-native';
import { GestureHandlerButton } from '@/components/buttons/GestureHandlerButton';
import { AnimatedText, Box } from '@/design-system';
import Animated, {
  type AnimatedRef,
  type SharedValue,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';
import { triggerHaptics } from 'react-native-turbo-haptics';
import Clipboard from '@react-native-clipboard/clipboard';
import * as i18n from '@/languages';
import { THICK_BORDER_WIDTH } from '@/styles/constants';
import useClipboard from '@/hooks/useClipboard';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { IS_ANDROID } from '@/env';
import { TOKEN_SEARCH_CONTROL_ITEM_HEIGHT } from './constants';

const CANCEL_LABEL = i18n.t(i18n.l.button.cancel);
const CLOSE_LABEL = i18n.t(i18n.l.button.close);
const PASTE_LABEL = i18n.t(i18n.l.button.paste);

export type AnimatedButtonStyles = {
  buttonWrapperStyle: ReturnType<typeof useAnimatedStyle>;
  buttonStyle: ReturnType<typeof useAnimatedStyle>;
};

export const SearchInputButton = ({
  enablePaste,
  showButtonWhenNoAsset,
  pastedSearchInputValue,
  isSearchFocused,
  isTokenListFocused,
  onCancelOrClosePressWorklet,
  onPasteSearchQuery,
  searchInputRef,
  isAssetSelected,
  animatedButtonStyles,
}: {
  enablePaste: boolean;
  showButtonWhenNoAsset: boolean;
  pastedSearchInputValue: SharedValue<string>;
  isSearchFocused: Readonly<SharedValue<boolean>>;
  isTokenListFocused: Readonly<SharedValue<boolean>>;
  onCancelOrClosePressWorklet: () => void;
  onPasteSearchQuery: (text: string) => void;
  searchInputRef: AnimatedRef<TextInput>;
  isAssetSelected: Readonly<SharedValue<boolean>>;
  animatedButtonStyles: AnimatedButtonStyles;
}) => {
  const { hasClipboardData } = useClipboard();

  const buttonText = useDerivedValue(() => {
    if (isSearchFocused.value) {
      return CANCEL_LABEL;
    }

    if (isAssetSelected.value || !enablePaste) {
      return CLOSE_LABEL;
    }

    return PASTE_LABEL;
  });

  const onPaste = useCallback(() => {
    Clipboard.getString().then(text => {
      // Slice the pasted text to the length of an ETH address
      const pastedText = text.trim().slice(0, 42);
      pastedSearchInputValue.value = pastedText;
      onPasteSearchQuery(pastedText);
    });
  }, [pastedSearchInputValue, onPasteSearchQuery]);

  const buttonInfo = useDerivedValue(() => {
    const clipboardDataAvailable = hasClipboardData || IS_ANDROID;

    const isPasteDisabled = enablePaste && !isAssetSelected.value && isTokenListFocused.value && !clipboardDataAvailable;
    const isVisible = isSearchFocused.value || showButtonWhenNoAsset || isAssetSelected.value;
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
          searchInputRef.current?.blur();
        }}
        onPressWorklet={() => {
          'worklet';
          if (enablePaste && isTokenListFocused.value && !isAssetSelected.value) {
            if (buttonInfo.value.isPasteDisabled) {
              triggerHaptics('notificationError');
            } else {
              runOnJS(onPaste)();
            }
          }

          if (isSearchFocused.value || isAssetSelected.value) {
            onCancelOrClosePressWorklet();
          }
        }}
        scaleTo={0.8}
      >
        <Box
          as={Animated.View}
          alignItems="center"
          borderRadius={TOKEN_SEARCH_CONTROL_ITEM_HEIGHT / 2}
          height={{ custom: TOKEN_SEARCH_CONTROL_ITEM_HEIGHT }}
          justifyContent="center"
          paddingHorizontal={{ custom: 12 - THICK_BORDER_WIDTH }}
          style={[
            animatedButtonStyles.buttonWrapperStyle,
            {
              borderCurve: 'continuous',
              borderWidth: THICK_BORDER_WIDTH,
              overflow: 'hidden',
            },
          ]}
        >
          <AnimatedText align="center" style={animatedButtonStyles.buttonStyle} size="17pt" weight="heavy">
            {buttonText}
          </AnimatedText>
        </Box>
      </GestureHandlerButton>
    </Animated.View>
  );
};
