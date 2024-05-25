import React, { useCallback, useMemo } from 'react';
import { NativeSyntheticEvent, TextInputChangeEventData } from 'react-native';
import Animated, { SharedValue, useAnimatedProps, useDerivedValue, dispatchCommand } from 'react-native-reanimated';
import { ButtonPressAnimation } from '@/components/animations';
import { Input } from '@/components/inputs';
import { AnimatedText, Bleed, Box, Column, Columns, Text, useColorMode, useForegroundColor } from '@/design-system';
import { LIGHT_SEPARATOR_COLOR, SEPARATOR_COLOR, THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { getColorValueForThemeWorklet, opacity } from '@/__swaps__/utils/swaps';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { swapsStore } from '@/state/swaps/swapsStore';

const AnimatedInput = Animated.createAnimatedComponent(Input);

export const SearchInput = ({
  asset,
  handleExitSearch,
  handleFocusSearch,
  output,
}: {
  asset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  handleExitSearch: () => void;
  handleFocusSearch: () => void;
  output?: boolean;
}) => {
  const { searchInputRef, inputProgress, outputProgress, AnimatedSwapStyles } = useSwapContext();
  const { isDarkMode } = useColorMode();

  const fillTertiary = useForegroundColor('fillTertiary');
  const label = useForegroundColor('label');
  const labelQuaternary = useForegroundColor('labelQuaternary');

  const btnText = useDerivedValue(() => {
    if ((inputProgress.value === 2 && !output) || (outputProgress.value === 2 && output)) {
      return 'Cancel';
    }

    return 'Close';
  });

  const defaultValue = useMemo(() => {
    return output ? swapsStore.getState().outputSearchQuery : swapsStore.getState().inputSearchQuery;
  }, [output]);

  const onSearchQueryChange = useCallback(
    (event: NativeSyntheticEvent<TextInputChangeEventData>) => {
      output
        ? swapsStore.setState({ outputSearchQuery: event.nativeEvent.text })
        : swapsStore.setState({ inputSearchQuery: event.nativeEvent.text });
    },
    [output]
  );

  const searchInputValue = useAnimatedProps(() => {
    const isFocused = inputProgress.value >= 1 || outputProgress.value >= 1;

    // Removing the value when the input is focused allows the input to be reset to the correct value on blur
    const query = isFocused ? undefined : defaultValue;

    return {
      defaultValue,
      text: query,
      selectionColor: getColorValueForThemeWorklet(asset.value?.color, isDarkMode, true),
    };
  });

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
                  onChange={onSearchQueryChange}
                  onBlur={() => {
                    onSearchQueryChange({
                      nativeEvent: {
                        text: '',
                      },
                    } as NativeSyntheticEvent<TextInputChangeEventData>);
                    handleExitSearch();
                  }}
                  onFocus={handleFocusSearch}
                  placeholder={output ? 'Find a token to buy' : 'Search your tokens'}
                  placeholderTextColor={isDarkMode ? opacity(labelQuaternary, 0.3) : labelQuaternary}
                  selectTextOnFocus
                  ref={searchInputRef}
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
          <ButtonPressAnimation
            onPress={() => {
              // TODO: This doesn't cause the blur to happen...
              dispatchCommand(searchInputRef, 'blur');
              onSearchQueryChange({
                nativeEvent: {
                  text: '',
                },
              } as NativeSyntheticEvent<TextInputChangeEventData>);
              handleExitSearch();
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
                text={btnText}
                align="center"
                style={output ? AnimatedSwapStyles.searchOutputAssetButtonStyle : AnimatedSwapStyles.searchInputAssetButtonStyle}
                size="17pt"
                weight="heavy"
              />
            </Box>
          </ButtonPressAnimation>
        </Column>
      </Columns>
    </Box>
  );
};
