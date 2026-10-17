import { memo, useMemo } from 'react';
import { StyleSheet } from 'react-native';

import ImgixImage from '@/components/images/ImgixImage';
import { useColorMode } from '@/design-system/color/ColorMode';
import { Bleed } from '@/design-system/components/Bleed/Bleed';
import { Box } from '@/design-system/components/Box/Box';
import { Text } from '@/design-system/components/Text/Text';
import { opacity } from '@/design-system/utils/opacity';
import { OutcomeBadge } from '@/features/polymarket/components/OutcomeBadge';
import { white } from '@/worklets/colors';

/** Minimum height shared by an outcome card and its loading placeholder. */
export const POLYMARKET_OUTCOME_CARD_MIN_HEIGHT = 78;

type OutcomeCardProps = {
  accentColor: string;
  icon: string;
  outcomeTitle: string;
  outcomeSubtitle: string;
  groupItemTitle?: string;
  outcome: string;
  outcomeIndex: number;
};

/**
 * Displays the selected outcome in a Polymarket buy or sell sheet.
 */
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
      backgroundColor={isDarkMode ? opacity(accentColor, 0.08) : white(0.9)}
      borderColor={{ custom: opacity(accentColor, 0.03) }}
      borderRadius={26}
      borderWidth={isDarkMode ? 2.5 : 0}
      padding="20px"
      style={styles.container}
    >
      <Box flexDirection="row" alignItems="center" gap={12}>
        <ImgixImage enableFasterImage resizeMode="cover" size={38} source={{ uri: icon }} style={styles.image} />
        <Box gap={10} style={styles.flex}>
          <Box flexDirection="row" alignItems="center" gap={6}>
            <Text size="15pt" weight="semibold" color="labelTertiary" numberOfLines={1} style={styles.flex}>
              {outcomeTitle}
            </Text>
            {groupItemTitle && !isOutcomeBadgeRepetitive ? (
              <Bleed vertical="8px">
                <OutcomeBadge outcome={outcome} outcomeIndex={outcomeIndex} color={accentColor} />
              </Bleed>
            ) : null}
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
  container: { minHeight: POLYMARKET_OUTCOME_CARD_MIN_HEIGHT },
  flex: {
    flex: 1,
  },
  image: {
    height: 38,
    width: 38,
    borderRadius: 10,
  },
});
