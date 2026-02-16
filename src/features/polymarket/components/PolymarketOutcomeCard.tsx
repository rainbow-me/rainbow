import { memo, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Box, Text, useColorMode, globalColors } from '@/design-system';
import { opacity } from '@/framework/ui/utils/opacity';
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
  const isOutcomeBadgeRepetitive = useMemo(() => outcomeSubtitle.toLowerCase().includes(outcome.toLowerCase()), [outcomeSubtitle, outcome]);
  return (
    <Box
      padding={'20px'}
      backgroundColor={isDarkMode ? opacity(accentColor, 0.08) : opacity(globalColors.white100, 0.9)}
      borderRadius={26}
      borderColor={{ custom: opacity(accentColor, 0.03) }}
      borderWidth={isDarkMode ? 2.5 : 0}
    >
      <Box flexDirection="row" alignItems="center" gap={12}>
        <ImgixImage enableFasterImage resizeMode="cover" size={38} source={{ uri: icon }} style={styles.image} />
        <Box gap={12} style={styles.flex}>
          <Box flexDirection="row" alignItems="center" gap={6} style={styles.flex}>
            <Text size="15pt" weight="semibold" color="labelTertiary" numberOfLines={1} style={styles.flex}>
              {outcomeTitle}
            </Text>
            {groupItemTitle && !isOutcomeBadgeRepetitive && (
              <OutcomeBadge outcome={outcome} outcomeIndex={outcomeIndex} color={accentColor} />
            )}
          </Box>
          <Text size="17pt" weight="bold" color="label">
            {outcomeSubtitle}
          </Text>
        </Box>
      </Box>
    </Box>
  );
});

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  image: {
    height: 38,
    width: 38,
    borderRadius: 10,
  },
});
