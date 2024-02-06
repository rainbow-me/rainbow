import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { Box, Inline, Inset, Text } from '@/design-system';
import { useTheme } from '@/theme';

export default function Callout({ after, before, children }: { after?: React.ReactNode; before?: React.ReactNode; children: string }) {
  const { colors } = useTheme();
  return (
    <Box
      as={LinearGradient}
      borderRadius={24}
      colors={colors.gradients.lightGreyWhite}
      end={{ x: 1, y: 0 }}
      height="40px"
      justifyContent="center"
      start={{ x: 0, y: 0 }}
    >
      <Inset horizontal="10px">
        <Inline alignHorizontal="justify" alignVertical="center" wrap={false}>
          <Inline alignVertical="center" space="8px" wrap={false}>
            {before}
            <Text color="secondary80 (Deprecated)" size="14px / 19px (Deprecated)" weight="heavy">
              {children}
            </Text>
          </Inline>
          {after}
        </Inline>
      </Inset>
    </Box>
  );
}
