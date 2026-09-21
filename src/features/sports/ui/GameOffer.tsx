import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { useLiveTokenSharedValue } from '@/components/live-token-text/LiveTokenText';
import { useColorMode } from '@/design-system/color/ColorMode';
import { globalColors } from '@/design-system/color/palettes';
import { AnimatedText } from '@/design-system/components/Text/AnimatedText';
import { Text } from '@/design-system/components/Text/Text';
import { opacity } from '@/design-system/utils/opacity';
import { type Selection } from '@/features/sports/core/generated/sports';
import { SportsSurface } from '@/features/sports/ui/SportsSurface';
import { roundWorklet, toPercentageWorklet } from '@/framework/core/safeMath';
import { getPolymarketTokenId } from '@/state/liveTokens/polymarketAdapter';
import { type TokenData } from '@/state/liveTokens/types';
import { getSolidColorEquivalent } from '@/worklets/colors';

export const GameOffer = memo(function GameOffer({
  selection,
  color = globalColors.grey60,
  line,
  glow = false,
  onPress,
  accessibilityLabel,
}: {
  selection: Selection;
  color?: string;
  line?: number;
  glow?: boolean;
  onPress: (selection: Selection) => void;
  accessibilityLabel: string;
}) {
  const { isDarkMode } = useColorMode();
  const isSpread = line !== undefined;
  const price = useLiveTokenSharedValue({
    tokenId: getPolymarketTokenId(selection.tokenId, 'midpoint'),
    initialValue: '—',
    autoSubscriptionEnabled: false,
    selector: formatProbability,
  });
  const background = isSpread
    ? isDarkMode
      ? opacity(color, 0.2)
      : undefined
    : getSolidColorEquivalent({ background: color, foreground: '#000000', opacity: isDarkMode ? 0.3 : 0.06 });

  return (
    <View accessible accessibilityRole="button" accessibilityLabel={accessibilityLabel} onAccessibilityTap={() => onPress(selection)}>
      <ButtonPressAnimation hitSlop={{ top: 1, bottom: 1 }} onPress={() => onPress(selection)} scaleTo={0.96}>
        <SportsSurface
          borderRadius={15}
          color={background}
          gradient={isSpread && !isDarkMode ? LIGHT_SPREAD_FILL : undefined}
          borderColor={
            isSpread ? (isDarkMode ? opacity(color, 0.06) : '#FFFFFF') : isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
          }
          borderWidth={isSpread && !isDarkMode ? 4 / 3 : 2}
          shadows={
            isSpread
              ? isDarkMode
                ? undefined
                : SPREAD_SHADOWS
              : glow && isDarkMode
                ? [...WINNER_SHADOWS, { color: opacity(color, 0.2), blur: 12, dx: 0, dy: 0 }]
                : WINNER_SHADOWS
          }
          innerShadow={
            isSpread
              ? isDarkMode
                ? { color: opacity(color, 0.35), blur: 6, dx: 0, dy: 0 }
                : undefined
              : { color: 'rgba(255,255,255,0.18)', blur: 2.5, dx: 0, dy: 1, blendMode: 'plus' }
          }
          style={styles.surface}
        >
          {isSpread && (
            <View style={styles.line}>
              <Text
                align="center"
                color={{ custom: isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(27,29,31,0.5)' }}
                size="13pt"
                weight="heavy"
                style={styles.lineText}
              >
                {line > 0 ? `+${line}` : line}
              </Text>
            </View>
          )}
          <View style={isSpread ? styles.spreadPrice : styles.winnerPrice}>
            <AnimatedText
              align="center"
              color={isSpread && !isDarkMode ? 'label' : 'white'}
              size={isSpread ? '15pt' : '18pt'}
              style={isSpread ? styles.spreadText : styles.winnerText}
              weight="heavy"
            >
              {price}
            </AnimatedText>
          </View>
        </SportsSurface>
      </ButtonPressAnimation>
    </View>
  );
});

function formatProbability(token: TokenData): string {
  return `${roundWorklet(toPercentageWorklet(token.price))}%`;
}

const LIGHT_SPREAD_FILL = ['rgba(255,255,255,0.54)', 'rgba(255,255,255,0.81)'] as const;
const WINNER_SHADOWS = [{ color: 'rgba(0,0,0,0.06)', blur: 6, dx: 0, dy: 4 }];
const SPREAD_SHADOWS = [
  { color: 'rgba(0,0,0,0.06)', blur: 8, dx: 0, dy: 2, drawBehind: true },
  { color: 'rgba(0,0,0,0.02)', blur: 3, dx: 0, dy: 2 },
];
const styles = StyleSheet.create({
  surface: { width: 62, height: 42 },
  line: { position: 'absolute', top: 8, left: 0, right: 0 },
  lineText: { letterSpacing: 0.72 },
  spreadPrice: { position: 'absolute', top: 22, left: 0, right: 0 },
  spreadText: { letterSpacing: 0.36 },
  winnerPrice: { flex: 1, justifyContent: 'center' },
  winnerText: {
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
