import React from 'react';
import { Box, Inline, Stack, Text } from '@/design-system';
import { TextSize } from '@/design-system/components/Text/Text';
import { Skeleton } from './Skeleton';

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

export const InfoCard = ({
  title,
  subtitle,
  mainText,
  icon,
  accentColor,
  mainTextColor = 'primary',
  loading,
}: LoadedProps | LoadingProps) => {
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
    <Box padding="20px" background="surfaceSecondaryElevated" shadow="12px" height={{ custom: 98 }} borderRadius={18}>
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
            <Text align="center" weight="heavy" size="12pt" color={{ custom: accentColor }}>
              {icon}
            </Text>
          )}
          <Text weight="heavy" size="13pt" color={{ custom: accentColor }}>
            {subtitle}
          </Text>
        </Inline>
      </Stack>
    </Box>
  );
};
