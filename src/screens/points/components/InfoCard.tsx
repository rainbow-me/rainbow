import React from 'react';
import { Box, Inline, Stack, Text } from '@/design-system';
import { TextSize } from '@/design-system/components/Text/Text';

export const InfoCard = ({
  // onPress,
  title,
  subtitle,
  mainText,
  icon,
  accentColor,
}: {
  // onPress: () => void;
  title: string;
  subtitle: string;
  mainText: string;
  icon: string;
  accentColor: string;
}) => {
  let mainTextFontSize: TextSize;
  if (mainText.length > 10) {
    mainTextFontSize = '17pt';
  } else if (mainText.length > 9) {
    mainTextFontSize = '20pt';
  } else {
    mainTextFontSize = '22pt';
  }

  return (
    // <ButtonPressAnimation onPress={onPress} overflowMargin={50}>
    <Box
      padding="20px"
      background="surfaceSecondaryElevated"
      shadow="12px"
      height={{ custom: 98 }}
      borderRadius={18}
    >
      <Stack space="12px">
        {/* <Inline space="4px" alignVertical="center"> */}
        <Text color="labelSecondary" weight="bold" size="15pt">
          {title}
        </Text>
        {/* <Text color="labelQuaternary" weight="heavy" size="13pt">
            􀅵
          </Text>
        </Inline> */}
        <Box height={{ custom: 15 }} justifyContent="flex-end">
          <Text color="label" weight="heavy" size={mainTextFontSize}>
            {mainText}
          </Text>
        </Box>
        <Inline space="4px">
          <Text
            align="center"
            weight="heavy"
            size="12pt"
            color={{ custom: accentColor }}
          >
            {icon}
          </Text>
          <Text weight="heavy" size="13pt" color={{ custom: accentColor }}>
            {subtitle}
          </Text>
        </Inline>
      </Stack>
    </Box>
    // </ButtonPressAnimation>
  );
};
