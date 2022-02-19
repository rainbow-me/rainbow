import React, { useCallback, useState } from 'react';
import ImagePicker from 'react-native-image-crop-picker';
import { ContextMenuButton } from 'react-native-ios-context-menu';
import RadialGradient from 'react-native-radial-gradient';
import { useTheme } from '@rainbow-me/context';
import { Box, Text, useForegroundColor } from '@rainbow-me/design-system';
import { ImgixImage } from '@rainbow-me/images';

const alpha = '33';

export default function Cover() {
  const { colors } = useTheme();
  const [coverUrl, setCoverUrl] = useState('');
  const accentColor = useForegroundColor('accent');

  const handleChooseCover = useCallback(async () => {
    const image = await ImagePicker.openPicker({});
    const stringIndex = image?.path.indexOf('/tmp');
    setCoverUrl(`~${image?.path.slice(stringIndex)}`);
  }, []);

  const handlePressMenuItem = useCallback(
    ({ nativeEvent: { actionKey } }) => {
      if (actionKey === 'library') {
        handleChooseCover();
      }
    },
    [handleChooseCover]
  );

  return (
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
      {coverUrl ? (
        <Box
          as={ImgixImage}
          height="126px"
          source={{ uri: coverUrl }}
          width="full"
        />
      ) : (
        <Box
          alignItems="center"
          as={RadialGradient}
          colors={[colors.whiteLabel + alpha, accentColor + alpha]}
          height="126px"
          justifyContent="center"
          stops={[0.6, 0]}
        >
          <Text color="accent" size="18px" weight="heavy">
            􀣵 Add Cover
          </Text>
        </Box>
      )}
    </ContextMenuButton>
  );
}
