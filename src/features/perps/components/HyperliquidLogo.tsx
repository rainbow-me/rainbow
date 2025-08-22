import React from 'react';
import { Box } from '@/design-system';
import { HYPERLIQUID_COLORS } from '@/features/perps/constants';
import { RainbowImage } from '@/components/RainbowImage';
import hyperliquidLogo from '@/assets/hyperliquidLogo.png';

export const HyperliquidLogo = ({ size = 20 }: { size?: number }) => {
  return (
    <Box
      backgroundColor={HYPERLIQUID_COLORS.darkGreen}
      borderRadius={6}
      borderWidth={0.5}
      borderColor={{ custom: '#1B3833' }}
      style={{ width: size, height: size }}
      justifyContent="center"
      alignItems="center"
    >
      <RainbowImage
        source={hyperliquidLogo}
        // TODO (kane): tint color not working
        style={{ width: size - 6, height: size - 6, tintColor: HYPERLIQUID_COLORS.mintGreen }}
      />
    </Box>
  );
};
