import React from 'react';
import Animated, {
  SharedValue,
  runOnJS,
  runOnUI,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated';
import { Input } from '@/components/inputs';
import { AnimatedText, Bleed, Box, Column, Columns, Text, useColorMode, useForegroundColor } from '@/design-system';
import { LIGHT_SEPARATOR_COLOR, SEPARATOR_COLOR, THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacity } from '@/__swaps__/utils/swaps';
import { NavigationSteps, useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { userAssetsStore } from '@/state/assets/userAssets';
import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { GestureHandlerV1Button } from './GestureHandlerV1Button';
import { useDebouncedCallback } from 'use-debounce';
import { useSwapsStore } from '@/state/swaps/swapsStore';

const AnimatedInput = Animated.createAnimatedComponent(Input);

export const SearchInput = ({
  asset,
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
    if ((inputProgress.value === 2 && !output) || (outputProgress.value === 2 && output)) {
      return 'Cancel';
    }

    if ((output && internalSelectedOutputAsset.value) || !output) {
      return 'Close';
    }

    // ⚠️ TODO: Add paste functionality to the asset to buy list when no asset is selected
    // return 'Paste';
  });

  const buttonVisibilityStyle = useAnimatedStyle(() => {
    const isSearchFocused = (output ? outputProgress : inputProgress).value === NavigationSteps.SEARCH_FOCUSED;
    const isAssetSelected = output ? internalSelectedOutputAsset.value : internalSelectedInputAsset.value;

    return {
      opacity: isSearchFocused || isAssetSelected ? 1 : 0,
      pointerEvents: isSearchFocused || isAssetSelected ? 'auto' : 'none',
    };
  });

  const onInputSearchQueryChange = useDebouncedCallback(
    (text: string) => {
      userAssetsStore.getState().setSearchQuery(text);
    },
    50,
    { leading: true, trailing: true }
  );

  const onOutputSearchQueryChange = useDebouncedCallback(
    (text: string) => {
      useSwapsStore.setState({ outputSearchQuery: text });
    },
    100,
    { leading: false, trailing: true }
  );

  const isSearchFocused = useDerivedValue(
    () =>
      (!output && inputProgress.value === NavigationSteps.SEARCH_FOCUSED) ||
      (output && outputProgress.value === NavigationSteps.SEARCH_FOCUSED)
  );

  const searchInputValue = useAnimatedProps(() => {
    // Removing the value when the input is focused allows the input to be reset to the correct value on blur
    const query = isSearchFocused.value ? undefined : '';

    return {
      text: query,
      defaultValue: '',
    };
  });

  useAnimatedReaction(
    () => isSearchFocused.value,
    (focused, prevFocused) => {
      if (focused === false && prevFocused === true) {
        if (output) runOnJS(onOutputSearchQueryChange)('');
        else runOnJS(onInputSearchQueryChange)('');
      }
    }
  );

  return (
    <Box width="full">
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
                  placeholder={output ? 'Find a token to buy' : 'Search your tokens'}
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
              onPressJS={() => (output ? outputSearchRef : inputSearchRef).current?.blur()}
              onPressWorklet={() => {
                'worklet';
                const isSearchFocused =
                  (output && outputProgress.value === NavigationSteps.SEARCH_FOCUSED) ||
                  (!output && inputProgress.value === NavigationSteps.SEARCH_FOCUSED);

                if (isSearchFocused || (output && internalSelectedOutputAsset.value) || (!output && internalSelectedInputAsset.value)) {
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
