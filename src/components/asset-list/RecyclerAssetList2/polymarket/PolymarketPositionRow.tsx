import { memo } from 'react';
import { Box, Text } from '@/design-system';
import { PolymarketPosition } from '@/features/polymarket/types';
import ImgixImage from '@/components/images/ImgixImage';

export const PolymarketPositionRow = memo(function PolymarketPositionRow({ position }: { position: PolymarketPosition }) {
  return (
    <Box paddingHorizontal="20px">
      <Box padding="16px" background="surfaceSecondaryElevated" flexDirection="row" alignItems="center" gap={8}>
        <ImgixImage resizeMode="cover" size={28} source={{ uri: position.icon }} style={{ height: 28, width: 28, borderRadius: 9 }} />
        <Text color="labelSecondary" size="13pt" weight="bold">
          {position.title}
        </Text>
        <Box>
          <Text color="labelSecondary" size="13pt" weight="bold">
            {position.currentValue}
          </Text>
          <Text color="labelSecondary" size="13pt" weight="bold">
            {position.cashPnl}
          </Text>
        </Box>
      </Box>
    </Box>
  );
});
