import { memo } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import polymarketLogo from '@/assets/polymarketLogo.png';
import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { globalColors } from '@/design-system/color/palettes';
import { Text } from '@/design-system/components/Text/Text';
import { opacity } from '@/design-system/utils/opacity';
import { formatCurrency } from '@/features/currency/utils/formatCurrency';
import { usePolymarketAccountValueSummary } from '@/features/polymarket/stores/derived/usePolymarketAccountValueSummary';
import { usePolymarketPositions } from '@/features/polymarket/stores/derived/usePolymarketPositions';
import { navigateToPolymarketPortfolio } from '@/features/polymarket/utils/navigateToPolymarket';
import { isZero } from '@/helpers/utilities';
import * as i18n from '@/languages';
import { THICKER_BORDER_WIDTH } from '@/styles/constants';

const HEIGHT = 40;
const LOGO_SIZE = 20;
const BADGE_SIZE = 20;

/**
 * Polymarket cash plus active positions value, with the active-position count, opening the Predictions portfolio.
 */
export const PolymarketPortfolioButton = memo(function PolymarketPortfolioButton({ isDarkMode }: { isDarkMode: boolean }) {
  const isEmpty = usePolymarketAccountValueSummary(s => isZero(s.totalValueUsd));
  const value = usePolymarketAccountValueSummary(s => formatCurrency(s.totalValueNative));
  const activePositionsCount = usePolymarketPositions(s => s.activePositions.length);

  const surfaceStyle = isDarkMode ? styles.surfaceDark : styles.surfaceLight;
  const showsPositions = !isEmpty && activePositionsCount > 0;

  return (
    <ButtonPressAnimation onPress={navigateToPolymarketPortfolio} scaleTo={0.9}>
      <View
        accessible
        accessibilityLabel={getAccessibilityLabel(value, showsPositions ? activePositionsCount : 0)}
        accessibilityRole="button"
        style={[styles.container, surfaceStyle]}
      >
        <Image source={polymarketLogo} style={[styles.logo, isEmpty && styles.logoEmpty]} />
        <Text color={isEmpty ? 'labelQuaternary' : 'label'} numberOfLines={1} size="15pt" weight="bold">
          {value}
        </Text>
        {showsPositions ? (
          <View style={[styles.badge, isDarkMode ? styles.badgeDark : styles.badgeLight]}>
            <Text color="labelSecondary" size="11pt" weight="heavy">
              {activePositionsCount}
            </Text>
          </View>
        ) : null}
      </View>
    </ButtonPressAnimation>
  );
});

function getAccessibilityLabel(value: string, positionsCount: number): string {
  const labels = i18n.l.predictions.portfolio_button;
  if (positionsCount === 0) return i18n.t(labels.label, { value });
  if (positionsCount === 1) return i18n.t(labels.label_positions_singular, { value });
  return i18n.t(labels.label_positions_plural, { value, count: positionsCount });
}

const styles = StyleSheet.create({
  container: {
    height: HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: HEIGHT / 2,
    borderWidth: THICKER_BORDER_WIDTH,
  },
  surfaceDark: {
    backgroundColor: '#070707',
    borderColor: opacity(globalColors.white100, 0.04),
  },
  surfaceLight: {
    backgroundColor: globalColors.white100,
    borderColor: opacity(globalColors.grey100, 0.06),
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: 6,
  },
  logoEmpty: { opacity: 0.4 },
  badge: {
    minWidth: BADGE_SIZE,
    height: BADGE_SIZE,
    paddingHorizontal: 6,
    borderRadius: BADGE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDark: { backgroundColor: opacity(globalColors.white100, 0.12) },
  badgeLight: { backgroundColor: opacity(globalColors.grey100, 0.06) },
});
