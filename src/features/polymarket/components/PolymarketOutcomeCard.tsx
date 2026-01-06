import { memo } from 'react';
import { Box, Text, useColorMode, globalColors } from '@/design-system';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import ImgixImage from '@/components/images/ImgixImage';
import { OutcomeBadge } from '@/features/polymarket/components/OutcomeBadge';

type OutcomeCardProps = {
  accentColor: string;
  icon: string;
  outcomeTitle: string;
  outcomeSubtitle: string;
  groupItemTitle?: string;
  outcome: string;
  outcomeIndex: number;
};

export const PolymarketOutcomeCard = memo(function PolymarketOutcomeCard({
  accentColor,
  outcomeTitle,
  outcomeSubtitle,
  icon,
  groupItemTitle,
  outcome,
  outcomeIndex,
}: OutcomeCardProps) {
  const { isDarkMode } = useColorMode();
  return (
    <Box
      padding={'20px'}
      backgroundColor={isDarkMode ? opacityWorklet(accentColor, 0.08) : opacityWorklet(globalColors.white100, 0.9)}
      borderRadius={26}
      borderColor={{ custom: opacityWorklet(accentColor, 0.03) }}
      borderWidth={isDarkMode ? 2.5 : 0}
    >
      <Box flexDirection="row" alignItems="flex-start" gap={12}>
        <ImgixImage
          enableFasterImage
          resizeMode="cover"
          size={38}
          source={{ uri: icon }}
          style={{ height: 38, width: 38, borderRadius: 10 }}
        />
        <Box gap={12} style={{ flex: 1 }}>
          <Text size="15pt" weight="semibold" color="labelTertiary" style={{ flex: 1 }} numberOfLines={1}>
            {outcomeTitle}
          </Text>
          <Text size="17pt" weight="bold" color="label">
            {outcomeSubtitle}
          </Text>
        </Box>
        {groupItemTitle && <OutcomeBadge outcome={outcome} outcomeIndex={outcomeIndex} color={accentColor} />}
      </Box>
    </Box>
  );
});
