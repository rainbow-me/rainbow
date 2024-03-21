import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacity } from '@/__swaps__/screens/Swap/utils';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { Box, Text, globalColors, useColorMode, useForegroundColor } from '@/design-system';
import { IS_IOS } from '@/env';
import position from '@/styles/position';
import { BlurView } from '@react-native-community/blur';
import React, { useCallback, RefObject } from 'react';
import { TextInput } from 'react-native';
import { DappBrowserShadows } from '../DappBrowserShadows';

export const TabButton = ({
  inputRef,
  isFocused,
  toggleTabView,
}: {
  inputRef: RefObject<TextInput>;
  isFocused: boolean;
  toggleTabView: () => void;
}) => {
  const { isDarkMode } = useColorMode();
  const fillSecondary = useForegroundColor('fillSecondary');
  const separatorSecondary = useForegroundColor('separatorSecondary');

  const buttonColorIOS = isDarkMode ? fillSecondary : opacity(globalColors.white100, 0.9);
  const buttonColorAndroid = isDarkMode ? globalColors.blueGrey100 : globalColors.white100;
  const buttonColor = IS_IOS ? buttonColorIOS : buttonColorAndroid;

  const onPress = useCallback(() => {
    if (!isFocused) {
      // open tabs
      toggleTabView();
    } else {
      // close keyboard
      inputRef?.current?.blur();
    }
  }, [isFocused, inputRef, toggleTabView]);

  return (
    <DappBrowserShadows>
      <Box
        as={ButtonPressAnimation}
        borderRadius={22}
        onPress={onPress}
        style={{ height: 44, paddingTop: isFocused ? 1 : undefined, width: 44 }}
        alignItems="center"
        justifyContent="center"
      >
        <Text align="center" color="labelSecondary" size="icon 17px" weight={isFocused ? 'heavy' : 'bold'}>
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
    </DappBrowserShadows>
  );
};
