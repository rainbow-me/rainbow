import React from 'react';

import { type Source } from 'react-native-fast-image';

import Caret from '@/assets/family-dropdown-arrow.png';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { ImgixImage } from '@/components/images';
import { Box, Inline, Stack, Text } from '@/design-system';
import { type TextColor } from '@/design-system/color/palettes';
import { type CustomColor } from '@/design-system/color/useForegroundColor';
import { useTheme } from '@/theme/ThemeContext';

const imageSize = 72;

type BackupOptionRowProps = {
  icon: Source | number;
  header: string;
  onPress: () => void;
  headerColor?: TextColor | CustomColor;
  disabled?: boolean;
  children: React.ReactNode;
};

export function BackupOptionRow({
  icon,
  header,
  headerColor = 'primary (Deprecated)',
  onPress,
  disabled = false,
  children,
}: BackupOptionRowProps) {
  const { colors } = useTheme();

  return (
    <ButtonPressAnimation disabled={disabled} scaleTo={0.95} onPress={onPress}>
      <Box alignItems="flex-start" justifyContent="flex-start" paddingTop={'24px'} paddingBottom={'36px'} gap={8}>
        <Box justifyContent="center" width="full">
          <Inline alignHorizontal="justify" alignVertical="center" wrap={false}>
            <Box flexShrink={1}>
              <Inline alignVertical="center" wrap={false}>
                <Box flexShrink={1}>
                  <Stack width="full" space="12px">
                    <Box
                      as={ImgixImage}
                      borderRadius={imageSize / 2}
                      height={{ custom: imageSize }}
                      marginLeft={{ custom: -12 }}
                      marginRight={{ custom: -12 }}
                      marginTop={{ custom: 0 }}
                      marginBottom={{ custom: -8 }}
                      source={icon}
                      width={{ custom: imageSize }}
                      size={imageSize}
                    />
                    <Text color={headerColor} size="18px / 27px (Deprecated)" weight="heavy" numberOfLines={1}>
                      {header}
                    </Text>
                    <Text color={'labelSecondary'} size="14px / 19px (Deprecated)" weight="medium">
                      {children}
                    </Text>
                  </Stack>
                </Box>
              </Inline>
            </Box>
            <Box paddingLeft="8px">
              <Box
                as={ImgixImage}
                height={{ custom: 16 }}
                source={Caret as Source}
                tintColor={colors.dark}
                width={{ custom: 7 }}
                size={30}
              />
            </Box>
          </Inline>
        </Box>
      </Box>
    </ButtonPressAnimation>
  );
}
