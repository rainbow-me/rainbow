import React from 'react';
import { Box, Inline, Stack, Text } from '@/design-system';

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
}) => (
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
      <Text color="label" weight="heavy" size="22pt">
        {mainText}
      </Text>
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
