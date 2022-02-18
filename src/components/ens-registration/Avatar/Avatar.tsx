import React, { useCallback } from 'react';
import ImagePicker from 'react-native-image-crop-picker';
import { ContextMenuButton } from 'react-native-ios-context-menu';
import Svg, { Path } from 'react-native-svg';
import ButtonPressAnimation from '../../animations/ButtonPressAnimation';
import {
  AccentColorProvider,
  BackgroundProvider,
  Box,
  Cover,
  Text,
  useForegroundColor,
} from '@rainbow-me/design-system';

const size = 70;

export default function Avatar() {
  const accentColor = useForegroundColor('accent');

  const handleChooseAvatar = useCallback(async () => {
    const image = await ImagePicker.openPicker({
      cropperCircleOverlay: true,
      cropping: true,
    });
    console.log('test', image);
  }, []);

  const handlePressMenuItem = useCallback(
    ({ nativeEvent: { actionKey } }) => {
      if (actionKey === 'library') {
        handleChooseAvatar();
      }
    },
    [handleChooseAvatar]
  );

  return (
    <Box height={{ custom: size }} width={{ custom: size }}>
      <Cover alignHorizontal="center">
        <BackgroundProvider color="body">
          {({ backgroundColor }) => (
            <Svg height="32" style={{ top: -6 }} viewBox="0 0 96 29" width="96">
              <Path
                d="M9.22449 23.5H0V28.5H96V23.5H86.7755C85.0671 23.5 83.4978 22.5584 82.6939 21.051C67.8912 -6.70409 28.1088 -6.70408 13.3061 21.051C12.5022 22.5584 10.9329 23.5 9.22449 23.5Z"
                fill={backgroundColor as any}
              />
            </Svg>
          )}
        </BackgroundProvider>
      </Cover>
      <ContextMenuButton
        enableContextMenu
        menuConfig={{
          menuItems: [
            {
              actionKey: 'library',
              actionTitle: 'Choose from Library',
              icon: {
                imageValue: {
                  systemName: 'photo',
                },
                type: 'IMAGE_SYSTEM',
              },
            },
          ],
          menuTitle: '',
        }}
        {...(android ? { onPress: () => {} } : {})}
        isMenuPrimaryAction
        onPressMenuItem={handlePressMenuItem}
        useActionSheetFallback={false}
      >
        <ButtonPressAnimation>
          <AccentColorProvider color={accentColor + '10'}>
            <Box
              alignItems="center"
              background="accent"
              borderRadius={size / 2}
              height={{ custom: size }}
              justifyContent="center"
              shadow="12px heavy accent"
              width={{ custom: size }}
            >
              <AccentColorProvider color={accentColor}>
                <Text color="accent" size="18px" weight="heavy">
                  {` 􀣵 `}
                </Text>
              </AccentColorProvider>
            </Box>
          </AccentColorProvider>
        </ButtonPressAnimation>
      </ContextMenuButton>
    </Box>
  );
}
