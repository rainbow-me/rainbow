import React from 'react';
import { Image } from 'react-native';
import { Box } from '@/design-system';
import { HYPERLIQUID_COLORS } from '@/features/perps/constants';
import hyperliquidLogo from '@/assets/hyperliquidLogo.png';

export const HyperliquidLogo = ({ size = 20 }: { size?: number }) => {
  return (
    <Box
      backgroundColor={HYPERLIQUID_COLORS.darkGreen}
      borderRadius={6}
      borderWidth={1}
      borderColor={{ custom: '#1B3833' }}
      style={{ width: size, height: size }}
      justifyContent="center"
      alignItems="center"
    >
      <Image source={hyperliquidLogo} style={{ width: size - 6, height: size - 6 }} tintColor={HYPERLIQUID_COLORS.mintGreen} />
    </Box>
  );
};
