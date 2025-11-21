import React, { memo, useMemo } from 'react';
import { ButtonPressAnimation } from '@/components/animations';
import { Box, Inline, Text, TextIcon } from '@/design-system';
import { useAccountAccentColor } from '@/hooks/useAccountAccentColor';
import { opacityWorklet } from '@/__swaps__/utils/swaps';

const HEIGHT = 48;

type SectionHeaderProps = {
  title: string;
  onPress: () => void;
  isDarkMode: boolean;
  value: string;
};

export const SectionHeader = memo(function SectionHeader({ title, onPress, isDarkMode, value }: SectionHeaderProps) {
  const { accentColor: accountColor } = useAccountAccentColor();

  const navigationButtonColors = useMemo(() => {
    return {
      icon: accountColor,
      border: opacityWorklet(accountColor, isDarkMode ? 0.08 : 0.015),
      background: opacityWorklet(accountColor, isDarkMode ? 0.16 : 0.1),
    };
  }, [accountColor, isDarkMode]);

  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={1.05} testID={`${title}-list-header`}>
      <Box height={{ custom: HEIGHT }} paddingHorizontal="20px" justifyContent="center">
        <Inline alignHorizontal="justify" alignVertical="center">
          <Inline horizontalSpace={'8px'} alignVertical="center">
            <Text size="22pt" color="label" weight="heavy">
              {title}
            </Text>
            <Box
              borderWidth={5 / 3}
              borderColor={{ custom: navigationButtonColors.border }}
              backgroundColor={navigationButtonColors.background}
              borderRadius={14}
              height={28}
              width={28}
              justifyContent="center"
              alignItems="center"
            >
              <TextIcon color={{ custom: navigationButtonColors.icon }} size="icon 14px" weight="heavy">
                {'􀆊'}
              </TextIcon>
            </Box>
          </Inline>

          <Inline horizontalSpace="8px" alignVertical="center">
            <Text align="right" color="label" size="20pt" weight="bold">
              {value}
            </Text>
          </Inline>
        </Inline>
      </Box>
    </ButtonPressAnimation>
  );
});
