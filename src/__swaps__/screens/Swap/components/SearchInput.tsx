import React from 'react';
import { TextInput } from 'react-native';
import { ButtonPressAnimation } from '@/components/animations';
import { Input } from '@/components/inputs';
import { AnimatedText, Bleed, Box, Column, Columns, Text, useColorMode, useForegroundColor } from '@/design-system';
import { LIGHT_SEPARATOR_COLOR, SEPARATOR_COLOR, THICK_BORDER_WIDTH } from '../constants';
import { opacity, opacityWorklet } from '../utils/swaps';
import Animated, { useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';
import { useSwapContext } from '../providers/swap-provider';

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
  const { inputProgress, outputProgress, SwapInputController } = useSwapContext();
  const { isDarkMode } = useColorMode();

  const inputRef = React.useRef<TextInput>(null);

  const fillTertiary = useForegroundColor('fillTertiary');
  const label = useForegroundColor('label');
  const labelQuaternary = useForegroundColor('labelQuaternary');

  const btnText = useDerivedValue(() => {
    if ((inputProgress.value === 2 && !output) || (outputProgress.value === 2 && output)) {
      return 'Cancel';
    }

    return 'Close';
  });

  const btnWrapperStyles = useAnimatedStyle(() => {
    return {
      backgroundColor: opacityWorklet(
        output ? SwapInputController.bottomColor.value : SwapInputController.topColor.value,
        isDarkMode ? 0.1 : 0.08
      ),
      borderColor: opacityWorklet(
        output ? SwapInputController.bottomColor.value : SwapInputController.topColor.value,
        isDarkMode ? 0.06 : 0.01
      ),
      borderWidth: THICK_BORDER_WIDTH,
    };
  });

  const btnTextStyles = useAnimatedStyle(() => {
    return {
      color: output ? SwapInputController.bottomColor.value : SwapInputController.topColor.value,
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
                <Input
                  onBlur={() => {
                    handleExitSearch();
                    SwapInputController.searchQuery.value = '';
                  }}
                  onChange={e => (SwapInputController.searchQuery.value = e.nativeEvent.text)}
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
                  value={SwapInputController.searchQuery.value}
                />
              </Columns>
            </Box>
          </Bleed>
        </Box>
        <Column width="content">
          <ButtonPressAnimation
            onPress={() => {
              handleExitSearch();
              inputRef.current?.blur();
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
              style={btnWrapperStyles}
            >
              <AnimatedText text={btnText} align="center" style={btnTextStyles} size="17pt" weight="heavy" />
            </Box>
          </ButtonPressAnimation>
        </Column>
      </Columns>
    </Box>
  );
};
