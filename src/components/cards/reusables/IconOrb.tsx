import React from 'react';
import { AccentColorProvider } from '@/design-system/color/AccentColorContext';
import { Box } from '@/design-system/components/Box/Box';
import { ColorModeProvider } from '@/design-system/color/ColorMode';
import { Text } from '@/design-system/components/Text/Text';
import Skeleton, { FakeText } from '@/components/skeleton/Skeleton';
import { TextSize, TextWeight } from '@/design-system/components/Text/Text';
import { useTheme } from '@/theme/ThemeContext';

export const ORB_SIZE = 36;

type ShadowColor = 'accent' | 'shadow';

type IconOrbProps = {
  color: string;
  shadowColor?: ShadowColor;
  icon: string;
  loaded?: boolean;
  textSize?: TextSize;
  textWeight?: TextWeight;
  borderColor?: string;
  borderWidth?: number;
};

export const IconOrb = ({
  borderColor,
  borderWidth,
  color,
  icon,
  loaded = true,
  shadowColor,
  textSize = '17pt',
  textWeight = 'bold',
}: IconOrbProps) => {
  const { isDarkMode } = useTheme();

  if (loaded) {
    return (
      <ColorModeProvider value={isDarkMode ? 'dark' : 'light'}>
        <AccentColorProvider color={color}>
          {shadowColor ? (
            <Box
              width={{ custom: ORB_SIZE }}
              height={{ custom: ORB_SIZE }}
              style={{ borderColor, borderWidth }}
              borderRadius={ORB_SIZE / 2}
              background="accent"
              alignItems="center"
              justifyContent="center"
              shadow={shadowColor === 'accent' ? '18px accent' : '18px'}
            >
              <Text containsEmoji size={textSize} weight={textWeight} align="center" color="label">
                {icon}
              </Text>
            </Box>
          ) : (
            <Box
              width={{ custom: ORB_SIZE }}
              height={{ custom: ORB_SIZE }}
              style={{ borderColor, borderWidth }}
              borderRadius={ORB_SIZE / 2}
              background="accent"
              alignItems="center"
              justifyContent="center"
            >
              <Text containsEmoji size={textSize} weight={textWeight} align="center" color="label">
                {icon}
              </Text>
            </Box>
          )}
        </AccentColorProvider>
      </ColorModeProvider>
    );
  } else {
    return (
      <Box height={{ custom: ORB_SIZE }}>
        <Skeleton>
          <FakeText height={ORB_SIZE} width={ORB_SIZE} />
        </Skeleton>
      </Box>
    );
  }
};
