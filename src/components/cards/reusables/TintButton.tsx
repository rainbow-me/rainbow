import {
  AccentColorProvider,
  Box,
  Text,
  useAccentColor,
} from '@/design-system';
import React from 'react';
import { ButtonPressAnimation } from '../../animations';
import ConditionalWrap from 'conditional-wrap';
import { colors } from '@/styles';

interface TintButtonProps {
  children: string;
  onPress: () => void;
  width?: number;
  height: number;
}

export const TintButton = ({
  children,
  height,
  onPress,
  width,
}: TintButtonProps) => {
  const { color, mode } = useAccentColor();
  const isDarkMode = mode === 'darkTinted' || mode === 'dark';

  return (
    <ConditionalWrap
      condition={isDarkMode}
      wrap={(children: React.ReactNode) => (
        <AccentColorProvider color={colors.alpha(color, 0.1)}>
          {children}
        </AccentColorProvider>
      )}
    >
      <ButtonPressAnimation onPress={onPress}>
        <Box
          background="accent"
          borderRadius={99}
          height={{ custom: height }}
          width={width ? { custom: width } : 'full'}
          alignItems="center"
          justifyContent="center"
        >
          <Text
            color={isDarkMode ? { custom: color } : 'label'}
            containsEmoji
            size="15pt"
            weight="bold"
          >
            {children}
          </Text>
        </Box>
      </ButtonPressAnimation>
    </ConditionalWrap>
  );
};
