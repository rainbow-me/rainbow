import { LiveTokenText } from '@/components/live-token-text/LiveTokenText';
import { Box, Text } from '@/design-system';
import { HyperliquidTokenIcon } from '@/features/perps/components/HyperliquidTokenIcon';
import { getHyperliquidTokenId } from '@/features/perps/utils';
import { formatPerpAssetPrice } from '@/features/perps/utils/formatPerpsAssetPrice';
import { memo } from 'react';

type PerpBottomSheetHeaderProps = {
  title: string;
  symbol: string;
};

export const PerpBottomSheetHeader = memo(function PerpBottomSheetHeader({ title, symbol }: PerpBottomSheetHeaderProps) {
  return (
    <Box flexDirection="row" alignItems="center" justifyContent="space-between" width="full" paddingHorizontal={'12px'}>
      <Text size="20pt" weight="heavy" color={'label'}>
        {title}
      </Text>
      <Box gap={12} alignItems="flex-end">
        <Text size="15pt" weight="bold" color={'labelQuaternary'}>
          {'Current Price'}
        </Text>
        <Box flexDirection="row" alignItems="center" gap={4}>
          <HyperliquidTokenIcon symbol={symbol} size={14} />
          <LiveTokenText
            tokenId={getHyperliquidTokenId(symbol)}
            size="15pt"
            weight="heavy"
            color={'labelSecondary'}
            initialValue={'-'}
            selector={token => formatPerpAssetPrice(token.price)}
          />
        </Box>
      </Box>
    </Box>
  );
});
