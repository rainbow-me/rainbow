import { AccentColorProvider, Box, Text, useAccentColor } from '@/design-system';
import React from 'react';
import { ButtonPressAnimation } from '../../animations';
import ConditionalWrap from 'conditional-wrap';
import { colors } from '@/styles';
import Skeleton, { FakeText } from '@/components/skeleton/Skeleton';

interface TintButtonProps {
  children: string;
  onPress: () => void;
  width?: number;
  height: number;
  loaded?: boolean;
  testID?: string;
}

export const TintButton = ({ children, height, loaded = true, onPress, width, testID }: TintButtonProps) => {
  const { color, mode } = useAccentColor();
  const isDarkMode = mode === 'darkTinted' || mode === 'dark';

  if (loaded) {
    return (
      <ConditionalWrap
        condition={isDarkMode}
        wrap={(children: React.ReactNode) => <AccentColorProvider color={colors.alpha(color, 0.1)}>{children}</AccentColorProvider>}
      >
        <ButtonPressAnimation onPress={onPress} scaleTo={0.92} testID={testID}>
          <Box
            background="accent"
            borderRadius={99}
            height={{ custom: height }}
            width={width ? { custom: width } : 'full'}
            alignItems="center"
            justifyContent="center"
          >
            <Text color={isDarkMode ? { custom: color } : 'label'} containsEmoji size="15pt" weight="bold">
              {children}
            </Text>
          </Box>
        </ButtonPressAnimation>
      </ConditionalWrap>
    );
  } else {
    return (
      <Box height={{ custom: height }}>
        <Skeleton>
          <FakeText height={height} />
        </Skeleton>
      </Box>
    );
  }
};
