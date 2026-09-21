import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { useAnimatedStyle } from 'react-native-reanimated';

import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { useLiveTokenSharedValue } from '@/components/live-token-text/LiveTokenText';
import { useColorMode } from '@/design-system/color/ColorMode';
import { globalColors } from '@/design-system/color/palettes';
import { Border } from '@/design-system/components/Border/Border';
import { AnimatedText } from '@/design-system/components/Text/AnimatedText';
import { Text } from '@/design-system/components/Text/Text';
import { textSizes } from '@/design-system/typography/typography';
import { opacity } from '@/design-system/utils/opacity';
import { roundWorklet, toPercentageWorklet } from '@/framework/core/safeMath';
import { getPolymarketTokenId } from '@/state/liveTokens/polymarketAdapter';
import { type TokenData } from '@/state/liveTokens/types';
import { getSolidColorEquivalent } from '@/worklets/colors';

export const GameOffer = memo(function GameOffer({
  tokenId,
  color = globalColors.grey60,
  line,
  glow = false,
  onPress,
  accessibilityLabel,
}: {
  tokenId: string;
  color?: string;
  line?: number;
  glow?: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  const { isDarkMode } = useColorMode();
  const isSpread = line !== undefined;
  const price = useLiveTokenSharedValue({
    tokenId: getPolymarketTokenId(tokenId, 'midpoint'),
    initialValue: '—',
    autoSubscriptionEnabled: false,
    selector: formatProbability,
  });
  const probabilityStyle = useAnimatedStyle(() => (isSpread || price.value === '100%' ? SMALL_PROBABILITY_STYLE : PROBABILITY_STYLE));
  const background = isSpread
    ? isDarkMode
      ? opacity(color, 0.2)
      : undefined
    : getSolidColorEquivalent({ background: color, foreground: '#000000', opacity: isDarkMode ? 0.3 : 0.06 });

  const spreadGradient =
    isSpread && isDarkMode
      ? ([
          opacity(color, 0.18),
          opacity(color, 0.08),
          opacity(color, 0),
          opacity(color, 0),
          opacity(color, 0.08),
          opacity(color, 0.18),
        ] as const)
      : undefined;

  return (
    <View accessible accessibilityRole="button" accessibilityLabel={accessibilityLabel} onAccessibilityTap={onPress}>
      <ButtonPressAnimation
        hitSlop={{ top: 1, bottom: 1 }}
        onPress={event => {
          event?.stopPropagation();
          onPress();
        }}
        scaleTo={0.96}
      >
        <View style={isSpread ? !isDarkMode && styles.spreadShadow : glow && isDarkMode && [styles.glow, { shadowColor: color }]}>
          <View
            style={[styles.surface, { backgroundColor: background }, isSpread ? !isDarkMode && styles.tightShadow : styles.winnerShadow]}
          >
            <View pointerEvents="none" style={styles.background}>
              {isSpread ? (
                <LinearGradient
                  colors={spreadGradient ?? LIGHT_SPREAD_FILL}
                  locations={spreadGradient ? SPREAD_VERTICAL_STOPS : undefined}
                  style={StyleSheet.absoluteFill}
                />
              ) : (
                <LinearGradient colors={WINNER_HIGHLIGHT} locations={[0, 0.25, 0.5, 0.75, 1]} style={styles.highlight} />
              )}
              {spreadGradient && (
                <LinearGradient
                  colors={spreadGradient}
                  locations={SPREAD_HORIZONTAL_STOPS}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              )}
            </View>
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
                size="15pt"
                style={[probabilityStyle, isSpread ? styles.spreadText : styles.winnerText]}
                weight="heavy"
              >
                {price}
              </AnimatedText>
            </View>
            <Border
              borderRadius={15}
              borderWidth={isSpread && !isDarkMode ? 4 / 3 : 2}
              borderColor={{
                custom: isSpread
                  ? isDarkMode
                    ? opacity(color, 0.06)
                    : '#FFFFFF'
                  : isDarkMode
                    ? 'rgba(255,255,255,0.1)'
                    : 'rgba(0,0,0,0.1)',
              }}
              enableInLightMode
            />
          </View>
        </View>
      </ButtonPressAnimation>
    </View>
  );
});

function formatProbability(token: TokenData): string {
  return `${roundWorklet(toPercentageWorklet(token.price))}%`;
}

const SMALL_PROBABILITY_STYLE = textSizes['15pt'];
const PROBABILITY_STYLE = textSizes['18pt'];
const SPREAD_VERTICAL_STOPS = [0, 4 / 42, 12 / 42, 30 / 42, 38 / 42, 1] as const;
const SPREAD_HORIZONTAL_STOPS = [0, 4 / 62, 12 / 62, 50 / 62, 58 / 62, 1] as const;
const LIGHT_SPREAD_FILL = ['rgba(255,255,255,0.54)', 'rgba(255,255,255,0.81)'] as const;
const WINNER_HIGHLIGHT = [
  'rgba(255,255,255,0.12)',
  'rgba(255,255,255,0.055)',
  'rgba(255,255,255,0.018)',
  'rgba(255,255,255,0.004)',
  'rgba(255,255,255,0)',
] as const;
const styles = StyleSheet.create({
  surface: {
    width: 62,
    height: 42,
    borderRadius: 15,
    borderCurve: 'continuous',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 15,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 12,
  },
  winnerShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  spreadShadow: {
    borderRadius: 15,
    borderCurve: 'continuous',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  tightShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
  },
  glow: {
    borderRadius: 15,
    borderCurve: 'continuous',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  line: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
  },
  lineText: { letterSpacing: 0.72 },
  spreadPrice: {
    position: 'absolute',
    top: 22,
    left: 0,
    right: 0,
  },
  spreadText: { letterSpacing: 0.36 },
  winnerPrice: { flex: 1, justifyContent: 'center' },
  winnerText: {
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
