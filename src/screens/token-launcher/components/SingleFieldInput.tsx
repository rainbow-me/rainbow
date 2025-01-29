import React, { useCallback } from 'react'; // Add useRef import
import { Box, Text, TextShadow, useTextStyle } from '@/design-system';
import { Input } from '@/components/inputs';
import Animated, {
  AnimatedRef,
  dispatchCommand,
  runOnUI,
  useAnimatedProps,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { colors } from '@/styles';
import { NativeSyntheticEvent, TextInput, TextInputChangeEventData } from 'react-native';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';

const AnimatedInput = Animated.createAnimatedComponent(Input);
const BORDER_WIDTH = 2.5;
const UNFOCUSED_BORDER_COLOR = 'rgba(255, 255, 255, 0.03)';

type SingleFieldInputProps = {
  placeholder: string;
  title: string;
};

export function SingleFieldInput({ title, placeholder }: SingleFieldInputProps) {
  const inputRef = useAnimatedRef<TextInput>();
  const isFocused = useSharedValue(false);
  const inputValue = useSharedValue('');

  const handleFocusWorklet = () => {
    'worklet';
    isFocused.value = true;
  };

  const handleBlurWorklet = () => {
    'worklet';
    isFocused.value = false;
  };

  const handleContainerPress = () => {
    'worklet';
    // isFocused.value = true;
    // What is the difference between this and dispatchCommand?
    inputRef.current?.focus();
    // dispatchCommand(inputRef, 'focus');
  };

  const containerStyle = useAnimatedStyle(() => ({
    borderColor: isFocused.value ? colors.blueGreyDark : UNFOCUSED_BORDER_COLOR,
  }));

  // const inputContainerStyle = useAnimatedStyle(() => ({
  //   pointerEvents: _WORKLET && isFocused.value ? 'none' : 'auto',
  // }));

  const onInputChange = useCallback(
    (event: NativeSyntheticEvent<TextInputChangeEventData>) => {
      inputValue.value = event.nativeEvent.text;
    },
    [inputValue]
  );

  // const searchInputValue = useAnimatedProps(() => {
  //   return { defaultValue: placeholder, text: placeholder };
  // });

  const inputTextStyle = useTextStyle({
    align: 'left',
    color: 'label',
    size: '17pt',
    weight: 'heavy',
  });

  return (
    // <GestureHandlerButton disabled={true} onPressWorklet={handleContainerPress} scaleTo={0.965} style={inputContainerStyle}>
    <Animated.View
      style={[
        containerStyle,
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          borderWidth: BORDER_WIDTH,
          borderRadius: 28,
          paddingHorizontal: 20,
          paddingVertical: 8 + 16,
        },
      ]}
    >
      <TextShadow blur={12} shadowOpacity={0.12}>
        <Text color="label" size="17pt" weight="heavy">
          {title}
        </Text>
      </TextShadow>
      <AnimatedInput
        // animatedProps={searchInputValue}
        ref={inputRef}
        style={[inputTextStyle, { flex: 1, textAlign: 'right' }]}
        onFocus={() => runOnUI(handleFocusWorklet)()}
        onBlur={() => runOnUI(handleBlurWorklet)()}
        onChange={onInputChange}
        placeholder={placeholder}
        spellCheck={false}
        textAlign="right"
        textAlignVertical="center"
      />
    </Animated.View>
    // </GestureHandlerButton>
  );
}
