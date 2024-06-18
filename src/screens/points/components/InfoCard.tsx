import React from 'react';
import { Border, Box, Inline, Stack, Text, TextShadow, globalColors, useColorMode } from '@/design-system';
import { TextSize } from '@/design-system/components/Text/Text';
import { Skeleton } from './Skeleton';
import { useAccountAccentColor } from '@/hooks';

type LoadedProps = {
  title: string;
  subtitle: string;
  mainText: string;
  icon?: string;
  accentColor: string;
  mainTextColor?: 'primary' | 'secondary';
  loading?: false;
};

type LoadingProps = {
  title?: string;
  subtitle?: string;
  mainText?: string;
  icon?: string;
  accentColor?: string;
  mainTextColor?: 'primary' | 'secondary';
  loading: true;
};

export const InfoCard = ({ title, subtitle, mainText, icon, mainTextColor = 'primary', loading }: LoadedProps | LoadingProps) => {
  const { highContrastAccentColor } = useAccountAccentColor();
  const { isDarkMode } = useColorMode();

  if (loading) return <Skeleton height={98} width={120} />;

  let mainTextFontSize: TextSize;
  if (mainText.length > 10) {
    mainTextFontSize = '17pt';
  } else if (mainText.length > 9) {
    mainTextFontSize = '20pt';
  } else {
    mainTextFontSize = '22pt';
  }

  return (
    <Box
      padding="20px"
      background="surfaceSecondaryElevated"
      shadow={isDarkMode ? undefined : '12px'}
      height={{ custom: 98 }}
      borderRadius={20}
      style={{ backgroundColor: isDarkMode ? '#191A1C' : globalColors.white100 }}
    >
      <Stack space="12px">
        <Text color="labelSecondary" weight="bold" size="15pt">
          {title}
        </Text>
        <Box height={{ custom: 15 }} justifyContent="flex-end">
          <Text color={mainTextColor === 'primary' ? 'label' : 'labelTertiary'} weight="heavy" size={mainTextFontSize}>
            {mainText}
          </Text>
        </Box>
        <Inline space="4px" wrap={false}>
          {icon && (
            <TextShadow blur={10} shadowOpacity={0.3}>
              <Text align="center" weight="heavy" size="12pt" color={{ custom: highContrastAccentColor }}>
                {icon}
              </Text>
            </TextShadow>
          )}
          <TextShadow blur={10} shadowOpacity={0.3}>
            <Text weight="heavy" size="13pt" color={{ custom: highContrastAccentColor }}>
              {subtitle}
            </Text>
          </TextShadow>
        </Inline>
      </Stack>
      <Border borderColor="separatorSecondary" borderRadius={20} />
    </Box>
  );
};
