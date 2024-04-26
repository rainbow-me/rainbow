import React, { useMemo } from 'react';
import { TextInput } from 'react-native';
import Animated, { useAnimatedRef, useDerivedValue } from 'react-native-reanimated';
import { Input } from '@/components/inputs';
import { AnimatedText, Bleed, Box, Column, Columns, Text, useColorMode, useForegroundColor } from '@/design-system';
import { LIGHT_SEPARATOR_COLOR, SEPARATOR_COLOR, THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacity } from '@/__swaps__/utils/swaps';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { GestureHandlerV1Button } from './GestureHandlerV1Button';

const AnimatedInput = Animated.createAnimatedComponent(Input);

export const SearchInput = ({
  color,
  handleExitSearch,
  handleFocusSearch,
  output,
}: {
  color: string;
  handleExitSearch: () => void;
  handleFocusSearch: () => void;
  output?: boolean;
}) => {
  const { inputProgress, outputProgress, SwapInputController, AnimatedSwapStyles } = useSwapContext();
  const { isDarkMode } = useColorMode();

  const inputRef = useAnimatedRef<TextInput>();

  const fillTertiary = useForegroundColor('fillTertiary');
  const label = useForegroundColor('label');
  const labelQuaternary = useForegroundColor('labelQuaternary');

  const btnText = useDerivedValue(() => {
    if ((inputProgress.value === 2 && !output) || (outputProgress.value === 2 && output)) {
      return 'Cancel';
    }

    return 'Close';
  });

  const initialValue = useMemo(() => {
    return SwapInputController.searchQuery.value;
  }, [SwapInputController.searchQuery.value]);

  const onPressWorklet = () => {
    'worklet';
    handleExitSearch();
    inputRef.current?.blur();
  };

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
                  onChange={e => {
                    SwapInputController.searchQuery.value = e.nativeEvent.text;
                  }}
                  onBlur={() => {
                    handleExitSearch();
                  }}
                  onFocus={() => {
                    handleFocusSearch();
                  }}
                  placeholder={output ? 'Find a token to buy' : 'Search your tokens'}
                  placeholderTextColor={isDarkMode ? opacity(labelQuaternary, 0.3) : labelQuaternary}
                  ref={inputRef}
                  selectionColor={color}
                  spellCheck={false}
                  style={{
                    color: label,
                    fontSize: 17,
                    fontWeight: 'bold',
                    height: 44,
                    zIndex: 10,
                  }}
                  defaultValue={initialValue}
                />
              </Columns>
            </Box>
          </Bleed>
        </Box>
        <Column width="content">
          <GestureHandlerV1Button onPressWorklet={onPressWorklet} scaleTo={0.8}>
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
          </GestureHandlerV1Button>
        </Column>
      </Columns>
    </Box>
  );
};
