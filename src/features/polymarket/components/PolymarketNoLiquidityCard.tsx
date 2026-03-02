import { memo } from 'react';
import { Box, Text, TextIcon } from '@/design-system';

type PolymarketNoLiquidityCardProps = {
  title: string;
  description: string;
};

export const PolymarketNoLiquidityCard = memo(function PolymarketNoLiquidityCard({ title, description }: PolymarketNoLiquidityCardProps) {
  return (
    <Box borderRadius={24} paddingHorizontal="20px" paddingVertical="16px" borderWidth={2} borderColor="separatorSecondary">
      <Box flexDirection="row" alignItems="center" gap={12}>
        <TextIcon color="orange" size="icon 20px" weight="heavy">
          {'􀇿'}
        </TextIcon>
        <Box gap={8}>
          <Text size="15pt" weight="bold" color="label">
            {title}
          </Text>
          <Text size="13pt" weight="medium" color="labelTertiary">
            {description}
          </Text>
        </Box>
      </Box>
    </Box>
  );
});
