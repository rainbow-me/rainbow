import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacity } from '@/__swaps__/utils/swaps';
import { AnimatedText, Bleed, Box, globalColors, useColorMode, useForegroundColor } from '@/design-system';
import { IS_IOS } from '@/env';
import position from '@/styles/position';
import { BlurView } from '@react-native-community/blur';
import React from 'react';
import { BrowserButtonShadows } from '../../DappBrowserShadows';
import { GestureHandlerV1Button } from '@/__swaps__/screens/Swap/components/GestureHandlerV1Button';
import Animated, { dispatchCommand, useAnimatedProps, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';
import { useBrowserContext } from '../../BrowserContext';
import { useSearchContext } from '../SearchContext';
import { TextColor } from '@/design-system/color/palettes';

const AnimatedBox = Animated.createAnimatedComponent(Box);
const SuperAnimatedText = Animated.createAnimatedComponent(AnimatedText);

export const TabButton = () => {
  const { toggleTabViewWorklet } = useBrowserContext();
  const { inputRef, isFocused } = useSearchContext();
  const { isDarkMode } = useColorMode();
  const fillSecondary = useForegroundColor('fillSecondary');
  const separatorSecondary = useForegroundColor('separatorSecondary');

  const buttonColorIOS = isDarkMode ? fillSecondary : opacity(globalColors.white100, 0.9);
  const buttonColorAndroid = isDarkMode ? globalColors.blueGrey100 : globalColors.white100;
  const buttonColor = IS_IOS ? buttonColorIOS : buttonColorAndroid;

  const onPress = () => {
    'worklet';
    if (isFocused) {
      if (!isFocused.value) {
        toggleTabViewWorklet();
      } else {
        isFocused.value = false;
        dispatchCommand(inputRef, 'blur');
      }
    }
  };

  const animatedBoxStyle = useAnimatedStyle(() => ({ paddingTop: isFocused?.value ? 1 : undefined }));

  const animatedText = useDerivedValue(() => (isFocused?.value ? '􀆈' : '􀐅'));
  const animatedTextProps = useAnimatedProps(() => ({ color: (isFocused?.value ? 'labelSecondary' : 'label') as TextColor }));

  return (
    <BrowserButtonShadows>
      <Bleed space="8px">
        <GestureHandlerV1Button onPressWorklet={onPress} style={{ padding: 8 }}>
          <AnimatedBox borderRadius={22} style={[animatedBoxStyle, { height: 44, width: 44 }]} alignItems="center" justifyContent="center">
            <SuperAnimatedText align="center" animatedProps={animatedTextProps} size="icon 17px" weight="heavy">
              {animatedText}
            </SuperAnimatedText>
            {IS_IOS && (
              <Box
                as={BlurView}
                blurAmount={20}
                blurType={isDarkMode ? 'dark' : 'light'}
                style={[
                  {
                    zIndex: -1,
                    elevation: -1,
                    borderRadius: 22,
                  },
                  position.coverAsObject,
                ]}
              />
            )}
            <Box
              style={[
                {
                  backgroundColor: buttonColor,
                  borderColor: separatorSecondary,
                  borderRadius: 22,
                  borderWidth: IS_IOS && isDarkMode ? THICK_BORDER_WIDTH : 0,
                  zIndex: -1,
                },
                position.coverAsObject,
              ]}
            />
          </AnimatedBox>
        </GestureHandlerV1Button>
      </Bleed>
    </BrowserButtonShadows>
  );
};
