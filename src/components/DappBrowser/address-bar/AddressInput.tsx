import React, { RefObject } from 'react';
import { Box, useForegroundColor } from '@/design-system';
import { ButtonPressAnimation } from '@/components/animations';
import Animated, {
  SharedValue,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { BlurView } from '@react-native-community/blur';
import { useDimensions } from '@/hooks';
import Input from '@/components/inputs/Input';
import * as i18n from '@/languages';
import { NativeSyntheticEvent, TextInput, TextInputSubmitEditingEventData } from 'react-native';
import { ToolbarIcon } from '../BrowserToolbar';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);
const AnimatedBox = Animated.createAnimatedComponent(Box);

export const AddressInput = ({
  inputRef,
  inputValue,
  onPress,
  onBlur,
  onFocus,
  onChangeText,
  onSubmitEditing,
  isFocused,
  animationProgress,
  tabViewProgress,
  shouldShowMenuButton,
  shouldShowRefreshButton,
  onRefresh,
}: {
  inputRef: RefObject<TextInput>;
  inputValue: string | undefined;
  onPress: () => void;
  onBlur: () => void;
  onFocus: () => void;
  onChangeText: (newUrl: string) => void;
  onSubmitEditing: (event: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => void;
  isFocused: boolean;
  animationProgress: SharedValue<number>;
  tabViewProgress: SharedValue<number> | undefined;
  shouldShowMenuButton: boolean;
  shouldShowRefreshButton: boolean;
  onRefresh: () => void;
}) => {
  const { width: deviceWidth } = useDimensions();

  const fill = useForegroundColor('fill');

  const fillSecondary = useForegroundColor('fillSecondary');

  const inputStyle = useAnimatedStyle(() => ({
    pointerEvents: (tabViewProgress?.value ?? 0) < 1 ? 'auto' : 'none',
    width: interpolate(isFocused ? 1 : 0, [1, 0], [deviceWidth - 100, deviceWidth - 120], 'clamp'),
    height: 48,
  }));

  const inputUnderlayStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      animationProgress.value ?? 0,
      [0, 1], // inputRange
      [fill, 'transparent']
    );

    return {
      pointerEvents: (tabViewProgress?.value ?? 0) < 1 ? 'auto' : 'none',
      width: interpolate(isFocused ? 1 : 0, [1, 0], [deviceWidth - 100, deviceWidth - 120], 'clamp'),
      height: 48,
      backgroundColor,
    };
  });

  return (
    <Box as={Animated.View} style={[inputStyle]}>
      <ButtonPressAnimation
        onPress={onPress}
        pointerEvents={isFocused ? 'auto' : 'box-only'}
        scaleTo={0.975}
        style={{
          flexDirection: 'row',
        }}
      >
        <Input
          clearButtonMode="while-editing"
          enablesReturnKeyAutomatically
          å
          keyboardType="web-search"
          // i18n
          placeholder={i18n.t(i18n.l.dapp_browser.address_bar.input_placeholder)}
          onBlur={onBlur}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onSubmitEditing={onSubmitEditing}
          ref={inputRef}
          returnKeyType="go"
          selectTextOnFocus
          spellCheck={false}
          style={{
            borderRadius: 16,
            flex: 1,
            fontSize: 17,
            fontWeight: '500',
            height: 48,
            paddingHorizontal: 16,
            paddingVertical: 10,
            pointerEvents: isFocused ? 'auto' : 'none',
            textAlign: isFocused ? 'left' : 'center',
            zIndex: 99,
            elevation: 99,
            borderWidth: 1,
            borderColor: fillSecondary,
          }}
          value={inputValue}
        ></Input>
        <Box as={AnimatedBlurView} blurAmount={1} blurType={'dark'} style={[{ position: 'absolute', borderRadius: 16 }, inputStyle]} />
        <Box as={AnimatedBox} style={[{ position: 'absolute', borderRadius: 16 }, inputUnderlayStyle]} />
      </ButtonPressAnimation>
      {shouldShowMenuButton && (
        <Box position="absolute" style={{ left: 10, top: 15 }}>
          <ToolbarIcon color="labelSecondary" icon="􀍡" onPress={() => {}} size="icon 17px" />
        </Box>
      )}
      {shouldShowRefreshButton && (
        <Box position="absolute" style={{ right: 10, top: 15 }}>
          <ToolbarIcon color="labelSecondary" icon="􀅈" onPress={onRefresh} size="icon 17px" />
        </Box>
      )}
    </Box>
  );
};
