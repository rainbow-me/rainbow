import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacity } from '@/__swaps__/utils/swaps';
import { Bleed, Box, Text, globalColors, useColorMode, useForegroundColor } from '@/design-system';
import { IS_IOS } from '@/env';
import position from '@/styles/position';
import { BlurView } from '@react-native-community/blur';
import React from 'react';
import { TextInput } from 'react-native';
import { BrowserButtonShadows } from '../DappBrowserShadows';
import { GestureHandlerV1Button } from '@/__swaps__/screens/Swap/components/GestureHandlerV1Button';
import { AnimatedRef, SharedValue, runOnJS } from 'react-native-reanimated';
import { useSharedValueState } from '@/hooks/reanimated/useSharedValueState';

export const TabButton = React.memo(function TabButton({
  inputRef,
  isFocusedValue,
  toggleTabViewWorklet,
}: {
  inputRef: AnimatedRef<TextInput>;
  isFocusedValue: SharedValue<boolean>;
  toggleTabViewWorklet(tabIndex?: number): void;
}) {
  const { isDarkMode } = useColorMode();
  const fillSecondary = useForegroundColor('fillSecondary');
  const separatorSecondary = useForegroundColor('separatorSecondary');

  const isFocused = useSharedValueState(isFocusedValue);

  const buttonColorIOS = isDarkMode ? fillSecondary : opacity(globalColors.white100, 0.9);
  const buttonColorAndroid = isDarkMode ? globalColors.blueGrey100 : globalColors.white100;
  const buttonColor = IS_IOS ? buttonColorIOS : buttonColorAndroid;

  const blurInput = () => {
    inputRef?.current?.blur();
  };

  const onPress = () => {
    'worklet';
    if (!isFocusedValue.value) {
      toggleTabViewWorklet();
    } else {
      runOnJS(blurInput)();
    }
  };

  return (
    <BrowserButtonShadows>
      <Bleed space="8px">
        <GestureHandlerV1Button onPressWorklet={onPress} style={{ padding: 8 }}>
          <Box
            borderRadius={22}
            style={{ height: 44, paddingTop: isFocused ? 1 : undefined, width: 44 }}
            alignItems="center"
            justifyContent="center"
          >
            <Text align="center" color={isFocused ? 'labelSecondary' : 'label'} size="icon 17px" weight="heavy">
              {isFocused ? '􀆈' : '􀐅'}
            </Text>
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
          </Box>
        </GestureHandlerV1Button>
      </Bleed>
    </BrowserButtonShadows>
  );
});
