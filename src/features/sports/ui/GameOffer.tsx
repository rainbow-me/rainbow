import { memo, useMemo, type ReactElement } from 'react';
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
import { THICK_BORDER_WIDTH } from '@/styles/constants';
import { black, getSolidColorEquivalent, white } from '@/worklets/colors';

const SPREAD_PROBABILITY_STYLE = textSizes['13pt'];
const SMALL_PROBABILITY_STYLE = textSizes['15pt'];
const PROBABILITY_STYLE = textSizes['17pt'];

const SPREAD_VERTICAL_STOPS = [0, 4 / 40, 12 / 40, 28 / 40, 36 / 40, 1] as const;
const SPREAD_HORIZONTAL_STOPS = [0, 4 / 60, 12 / 60, 48 / 60, 56 / 60, 1] as const;

const LIGHT_SPREAD_FILL = [white(0.54), white(0.81)] as const;
const WINNER_HIGHLIGHT = [white(0.12), white(0.055), white(0.018), white(0.004), white(0)] as const;

export const GameOffer = memo(function GameOffer({
  tokenId,
  color = globalColors.grey60,
  line,
  glow = false,
  onPress,
}: {
  tokenId: string;
  color?: string;
  line?: number;
  glow?: boolean;
  onPress: (color: string) => void;
}): ReactElement {
  const { isDarkMode } = useColorMode();

  const price = useLiveTokenSharedValue({
    tokenId: getPolymarketTokenId(tokenId, 'midpoint'),
    initialValue: '—',
    autoSubscriptionEnabled: false,
    selector: formatProbability,
  });

  const isSpread = !(line === undefined);

  const background = useMemo(() => {
    return isSpread
      ? isDarkMode
        ? opacity(color, 0.2)
        : undefined
      : getSolidColorEquivalent({ background: color, foreground: globalColors.grey100, opacity: isDarkMode ? 0.3 : 0.06 });
  }, [color, isDarkMode, isSpread]);

  const spreadGradient = useMemo(() => {
    if (!isSpread || !isDarkMode) return undefined;
    const outer = opacity(color, 0.18);
    const middle = opacity(color, 0.08);
    const inner = opacity(color, 0);

    return [outer, middle, inner, inner, middle, outer] as const;
  }, [color, isDarkMode, isSpread]);

  const probabilityStyle = useAnimatedStyle(() => {
    if (isSpread) return SPREAD_PROBABILITY_STYLE;
    return price.value === '100%' ? SMALL_PROBABILITY_STYLE : PROBABILITY_STYLE;
  });

  return (
    <ButtonPressAnimation
      hitSlop={{ top: 1, bottom: 1 }}
      onPress={event => {
        event?.stopPropagation();
        onPress(color);
      }}
      scaleTo={0.96}
    >
      <View
        style={
          isSpread ? (isDarkMode ? undefined : styles.spreadShadow) : glow && isDarkMode ? [styles.glow, { shadowColor: color }] : undefined
        }
      >
        <View
          style={[
            styles.surface,
            { backgroundColor: background },
            isSpread ? (isDarkMode ? undefined : styles.tightShadow) : styles.winnerShadow,
          ]}
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

            {spreadGradient ? (
              <LinearGradient
                colors={spreadGradient}
                locations={SPREAD_HORIZONTAL_STOPS}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            ) : null}
          </View>

          <View style={styles.content}>
            {isSpread ? (
              <Text align="center" color={{ custom: isDarkMode ? white(0.6) : globalColors.grey70 }} size="12pt" weight="heavy">
                {line > 0 ? `+${line}` : line}
              </Text>
            ) : null}
            <AnimatedText
              align="center"
              color={isSpread && !isDarkMode ? 'label' : 'white'}
              size={isSpread ? '13pt' : '17pt'}
              style={[probabilityStyle, isSpread ? undefined : styles.winnerText]}
              weight="heavy"
            >
              {price}
            </AnimatedText>
          </View>

          <Border
            borderRadius={14}
            borderWidth={isSpread && !isDarkMode ? THICK_BORDER_WIDTH : 2}
            borderColor={{
              custom: isSpread ? (isDarkMode ? opacity(color, 0.06) : globalColors.white100) : (isDarkMode ? white : black)(0.1),
            }}
            enableInLightMode
          />
        </View>
      </View>
    </ButtonPressAnimation>
  );
});

function formatProbability(token: TokenData): string {
  return `${roundWorklet(toPercentageWorklet(token.price))}%`;
}

const styles = StyleSheet.create({
  surface: {
    width: 60,
    height: 40,
    borderRadius: 14,
    borderCurve: 'continuous',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
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
    shadowColor: globalColors.grey100,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  spreadShadow: {
    borderRadius: 14,
    borderCurve: 'continuous',
    shadowColor: globalColors.grey100,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  tightShadow: {
    shadowColor: globalColors.grey100,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
  },
  glow: {
    borderRadius: 14,
    borderCurve: 'continuous',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 6 },
  winnerText: {
    textShadowColor: black(0.15),
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
