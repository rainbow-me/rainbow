import React from 'react';
import { Image } from 'react-native';
import { Box, Inline, Text } from '@/design-system';
import * as i18n from '@/languages';
import duneLogoDark from '@/assets/dune-logo-dark.png';
import duneLogo from '@/assets/dune-logo.png';
import { useTheme } from '@/theme';

export const RewardsDuneLogo: React.FC = () => {
  const { isDarkMode } = useTheme();
  return (
    <Box paddingBottom="28px" justifyContent="center" alignItems="center">
      <Inline space="8px" alignVertical="center">
        <Text size="13pt" color="labelQuaternary" weight="semibold">
          {i18n.t(i18n.l.rewards.data_powered_by)}
        </Text>
        <Box as={Image} source={isDarkMode ? duneLogoDark : duneLogo} width={{ custom: 63 }} height={{ custom: 22 }} />
      </Inline>
    </Box>
  );
};
