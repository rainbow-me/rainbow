import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { useLiveTokenSharedValue } from '@/components/live-token-text/LiveTokenText';
import { useColorMode } from '@/design-system/color/ColorMode';
import { globalColors } from '@/design-system/color/palettes';
import { AnimatedText } from '@/design-system/components/Text/AnimatedText';
import { Text } from '@/design-system/components/Text/Text';
import { opacity } from '@/design-system/utils/opacity';
import { InnerShadow } from '@/features/polymarket/components/InnerShadow';
import { type Selection } from '@/features/sports/core/generated/sports';
import { roundWorklet, toPercentageWorklet } from '@/framework/core/safeMath';
import { getPolymarketTokenId } from '@/state/liveTokens/polymarketAdapter';
import { type TokenData } from '@/state/liveTokens/types';
import { getSolidColorEquivalent } from '@/worklets/colors';

export const GameOffer = memo(function GameOffer({
  selection,
  color = globalColors.grey60,
  line,
  onPress,
  accessibilityLabel,
}: {
  selection: Selection;
  color?: string;
  line?: number;
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
  let backgroundColor = 'transparent';
  if (!isSpread) backgroundColor = getSolidColorEquivalent({ background: color, foreground: '#000000', opacity: isDarkMode ? 0.3 : 0.06 });
  else if (isDarkMode) backgroundColor = opacity(color, 0.2);

  return (
    <View accessible accessibilityRole="button" accessibilityLabel={accessibilityLabel} onAccessibilityTap={() => onPress(selection)}>
      <ButtonPressAnimation
        hitSlop={{ top: 1, bottom: 1 }}
        onPress={() => onPress(selection)}
        scaleTo={0.96}
        style={isSpread && !isDarkMode ? styles.spreadShadow : styles.winnerShadow}
      >
        <View style={[styles.surface, { backgroundColor }]}>
          {isSpread && !isDarkMode && (
            <LinearGradient colors={['rgba(255,255,255,0.54)', 'rgba(255,255,255,0.81)']} style={StyleSheet.absoluteFill} />
          )}
          {(!isSpread || isDarkMode) && (
            <InnerShadow
              borderRadius={15}
              blur={isSpread ? 12 : 5}
              color={isSpread ? opacity(color, 0.35) : 'rgba(255,255,255,0.18)'}
              dx={0}
              dy={isSpread ? 0 : 1}
              height={42}
              width={62}
            />
          )}
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
              size={isSpread ? '15pt' : '17pt'}
              style={isSpread ? styles.spreadText : styles.winnerText}
              tabularNumbers
              weight="heavy"
            >
              {price}
            </AnimatedText>
          </View>
          <View
            pointerEvents="none"
            style={[
              styles.border,
              isSpread
                ? { borderColor: isDarkMode ? opacity(color, 0.06) : '#FFFFFF', borderWidth: isDarkMode ? 2 : 4 / 3 }
                : { borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', borderWidth: 2 },
            ]}
          />
        </View>
      </ButtonPressAnimation>
    </View>
  );
});

function formatProbability(token: TokenData): string {
  return `${roundWorklet(toPercentageWorklet(token.price))}%`;
}

const styles = StyleSheet.create({
  surface: { width: 62, height: 42, borderRadius: 15, overflow: 'hidden' },
  border: { ...StyleSheet.absoluteFillObject, borderRadius: 15 },
  winnerShadow: { shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 6 },
  spreadShadow: { shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  line: { position: 'absolute', top: 7, left: 0, right: 0 },
  lineText: { letterSpacing: 0.72 },
  spreadPrice: { position: 'absolute', top: 22, left: 0, right: 0 },
  spreadText: { letterSpacing: 0.36 },
  winnerPrice: { flex: 1, justifyContent: 'center' },
  winnerText: {
    fontSize: 18,
    letterSpacing: 0.36,
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
});
