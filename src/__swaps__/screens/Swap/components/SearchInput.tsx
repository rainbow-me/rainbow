import { LIGHT_SEPARATOR_COLOR, SEPARATOR_COLOR, THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { NavigationSteps, useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { opacity } from '@/__swaps__/utils/swaps';
import { Input } from '@/components/inputs';
import { AnimatedText, Bleed, Box, Column, Columns, Text, useColorMode, useForegroundColor } from '@/design-system';
import * as i18n from '@/languages';
import { userAssetsStore } from '@/state/assets/userAssets';
import { useSwapsStore } from '@/state/swaps/swapsStore';
import Clipboard from '@react-native-clipboard/clipboard';
import React from 'react';
import Animated, {
  SharedValue,
  runOnJS,
  runOnUI,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import { useDebouncedCallback } from 'use-debounce';
import { GestureHandlerV1Button } from './GestureHandlerV1Button';

const AnimatedInput = Animated.createAnimatedComponent(Input);

const FIND_A_TOKEN_TO_BUY_LABEL = i18n.t(i18n.l.swap.find_a_token_to_buy);
const SEARCH_YOUR_TOKENS_LABEL = i18n.t(i18n.l.swap.search_your_tokens);
const CANCEL_LABEL = i18n.t(i18n.l.button.cancel);
const CLOSE_LABEL = i18n.t(i18n.l.button.close);
const PASTE_LABEL = i18n.t(i18n.l.button.paste);

export const SearchInput = ({
  handleExitSearchWorklet,
  handleFocusSearchWorklet,
  output,
}: {
  asset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  handleExitSearchWorklet: () => void;
  handleFocusSearchWorklet: () => void;
  output: boolean;
}) => {
  const { isDarkMode } = useColorMode();
  const {
    inputProgress,
    inputSearchRef,
    internalSelectedInputAsset,
    internalSelectedOutputAsset,
    outputProgress,
    outputSearchRef,
    AnimatedSwapStyles,
  } = useSwapContext();

  const fillTertiary = useForegroundColor('fillTertiary');
  const label = useForegroundColor('label');
  const labelQuaternary = useForegroundColor('labelQuaternary');

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

  const buttonVisibilityStyle = useAnimatedStyle(() => {
    const isInputSearchFocused =
      inputProgress.value === NavigationSteps.SEARCH_FOCUSED || inputProgress.value === NavigationSteps.TOKEN_LIST_FOCUSED;
    const noInputAssetSelected = !internalSelectedOutputAsset.value;
    const isVisible = output || isInputSearchFocused || noInputAssetSelected;

    return {
      opacity: isVisible ? 1 : 0,
      pointerEvents: isVisible ? 'auto' : 'none',
    };
  });

  const onInputSearchQueryChange = userAssetsStore(state => state.setSearchQuery);

  const onOutputSearchQueryChange = useDebouncedCallback((text: string) => useSwapsStore.setState({ outputSearchQuery: text }), 100, {
    leading: false,
    trailing: true,
  });

  const isSearchFocused = useDerivedValue(
    () =>
      (!output && inputProgress.value === NavigationSteps.SEARCH_FOCUSED) ||
      (output && outputProgress.value === NavigationSteps.SEARCH_FOCUSED)
  );

  const pastedSearchInputValue = useSharedValue('');
  const searchInputValue = useAnimatedProps(() => {
    // Removing the value when the input is focused allows the input to be reset to the correct value on blur
    const query = isSearchFocused.value ? undefined : '';
    return {
      text: pastedSearchInputValue.value || query,
      defaultValue: '',
    };
  });

  useAnimatedReaction(
    () => isSearchFocused.value,
    (focused, prevFocused) => {
      if (focused === false && prevFocused === true) {
        pastedSearchInputValue.value = '';
        if (output) runOnJS(onOutputSearchQueryChange)('');
        else runOnJS(onInputSearchQueryChange)('');
      }
    }
  );

  const onPaste = () => {
    Clipboard.getString().then(text => {
      // to prevent users from mistakingly pasting long ass texts when copying the wrong thing
      // we slice the string to 42 which is the size of a eth address,
      // no token name query search should be that big anyway
      const v = text.trim().slice(0, 42);
      pastedSearchInputValue.value = v;
      useSwapsStore.setState({ outputSearchQuery: v });
    });
  };

  return (
    <Box paddingHorizontal="20px" width="full">
      <Columns alignHorizontal="justify" alignVertical="center" space="20px">
        <Box>
          <Bleed horizontal="8px" vertical="24px">
            <Box paddingHorizontal="8px" paddingVertical="20px">
              <Columns alignVertical="center" space="10px">
                <Column width="content">
                  <Box
                    alignItems="center"
                    borderRadius={18}
                    height={{ custom: 36 }}
                    justifyContent="center"
                    style={{
                      backgroundColor: isDarkMode ? 'transparent' : opacity(fillTertiary, 0.03),
                      borderColor: isDarkMode ? SEPARATOR_COLOR : opacity(LIGHT_SEPARATOR_COLOR, 0.01),
                      borderWidth: THICK_BORDER_WIDTH,
                    }}
                    width={{ custom: 36 }}
                  >
                    <Text align="center" color="labelQuaternary" size="icon 17px" weight="bold">
                      􀊫
                    </Text>
                  </Box>
                </Column>
                <AnimatedInput
                  animatedProps={searchInputValue}
                  onChangeText={output ? onOutputSearchQueryChange : onInputSearchQueryChange}
                  onBlur={() => {
                    runOnUI(() => {
                      if (isSearchFocused.value) {
                        handleExitSearchWorklet();
                      }
                    })();

                    if (isSearchFocused.value) {
                      if (output) {
                        if (useSwapsStore.getState().outputSearchQuery !== '') {
                          useSwapsStore.setState({ outputSearchQuery: '' });
                        }
                      } else {
                        if (userAssetsStore.getState().inputSearchQuery !== '') {
                          userAssetsStore.getState().setSearchQuery('');
                        }
                      }
                    }
                  }}
                  onFocus={() => runOnUI(handleFocusSearchWorklet)()}
                  placeholder={output ? FIND_A_TOKEN_TO_BUY_LABEL : SEARCH_YOUR_TOKENS_LABEL}
                  placeholderTextColor={isDarkMode ? opacity(labelQuaternary, 0.3) : labelQuaternary}
                  selectTextOnFocus
                  ref={output ? outputSearchRef : inputSearchRef}
                  spellCheck={false}
                  style={{
                    color: label,
                    fontSize: 17,
                    fontWeight: 'bold',
                    height: 44,
                    zIndex: 10,
                  }}
                />
              </Columns>
            </Box>
          </Bleed>
        </Box>
        <Column width="content">
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

                if (
                  isSearchFocused.value ||
                  (output && internalSelectedOutputAsset.value) ||
                  (!output && internalSelectedInputAsset.value)
                ) {
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
                style={
                  output ? AnimatedSwapStyles.searchOutputAssetButtonWrapperStyle : AnimatedSwapStyles.searchInputAssetButtonWrapperStyle
                }
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
        </Column>
      </Columns>
    </Box>
  );
};
