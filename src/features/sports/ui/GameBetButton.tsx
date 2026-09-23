import { memo, useMemo, type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';

import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { globalColors } from '@/design-system/color/palettes';
import { Border } from '@/design-system/components/Border/Border';
import { AnimatedText } from '@/design-system/components/Text/AnimatedText';
import { Text } from '@/design-system/components/Text/Text';
import { textSizes } from '@/design-system/typography/typography';
import { opacity } from '@/design-system/utils/opacity';
import { roundWorklet, toPercentageWorklet } from '@/framework/core/safeMath';
import { useStoreSharedValue, type ReadOnlySharedValue } from '@/state/internal/hooks/useStoreSharedValue';
import { useLiveTokensStore } from '@/state/liveTokens/liveTokensStore';
import { getPolymarketTokenId } from '@/state/liveTokens/polymarketAdapter';
import { THICK_BORDER_WIDTH } from '@/styles/constants';
import { black, getSolidColorEquivalent, white } from '@/worklets/colors';

// ============ Types ========================================================== //

type BetContentProps = {
  color: string;
  isDarkMode: boolean;
  price: ReadOnlySharedValue<string | undefined>;
};

// ============ Constants ====================================================== //

const SMALL_PROBABILITY_STYLE = textSizes['15pt'];
const PROBABILITY_STYLE = textSizes['17pt'];

const SPREAD_VERTICAL_STOPS = [0, 4 / 40, 12 / 40, 28 / 40, 36 / 40, 1] as const;
const SPREAD_HORIZONTAL_STOPS = [0, 4 / 60, 12 / 60, 48 / 60, 56 / 60, 1] as const;
const WINNER_HIGHLIGHT_STOPS = [0, 0.25, 0.5, 0.75, 1] as const;

const LIGHT_SPREAD_FILL = [white(0.54), white(0.81)] as const;
const WINNER_HIGHLIGHT = [white(0.12), white(0.055), white(0.018), white(0.004), white(0)] as const;

// ============ Bet Button ===================================================== //

export const GameBetButton = memo(function GameBetButton({
  tokenId,
  isDarkMode,
  color = globalColors.grey60,
  line,
  glow = false,
  onPress,
}: {
  tokenId: string;
  isDarkMode: boolean;
  color?: string;
  line?: number;
  glow?: boolean;
  onPress: (color: string) => void;
}): ReactElement {
  const liveTokenId = getPolymarketTokenId(tokenId, 'midpoint');
  const price = useStoreSharedValue(useLiveTokensStore, s => s.tokens[liveTokenId]?.price);

  return (
    <ButtonPressAnimation
      hitSlop={{ top: 1, bottom: 1 }}
      onPress={event => {
        event?.stopPropagation();
        onPress(color);
      }}
      scaleTo={0.96}
    >
      {line === undefined ? (
        <WinnerBet color={color} isDarkMode={isDarkMode} price={price} glow={glow} />
      ) : (
        <SpreadBet color={color} isDarkMode={isDarkMode} price={price} line={line} />
      )}
    </ButtonPressAnimation>
  );
});

// ============ Bet Content ==================================================== //

function WinnerBet({ color, isDarkMode, price, glow }: BetContentProps & { glow: boolean }): ReactElement {
  const backgroundColor = useMemo(
    () => getSolidColorEquivalent({ background: color, foreground: globalColors.grey100, opacity: isDarkMode ? 0.3 : 0.06 }),
    [color, isDarkMode]
  );
  const probability = useDerivedValue(() => formatProbability(price));
  const probabilityStyle = useAnimatedStyle(() => (probability.value === '100%' ? SMALL_PROBABILITY_STYLE : PROBABILITY_STYLE));

  return (
    <View style={glow && isDarkMode ? [styles.glow, { shadowColor: color }] : undefined}>
      <View style={[styles.surface, { backgroundColor }, styles.winnerShadow]}>
        <View pointerEvents="none" style={styles.background}>
          <LinearGradient colors={WINNER_HIGHLIGHT} locations={WINNER_HIGHLIGHT_STOPS} style={styles.highlight} />
        </View>

        <View style={styles.content}>
          <AnimatedText align="center" color="white" size="17pt" style={[probabilityStyle, styles.winnerText]} weight="heavy">
            {probability}
          </AnimatedText>
        </View>

        <Border borderRadius={14} borderWidth={2} borderColor={{ custom: (isDarkMode ? white : black)(0.1) }} enableInLightMode />
      </View>
    </View>
  );
}

function SpreadBet({ color, isDarkMode, price, line }: BetContentProps & { line: number }): ReactElement {
  const gradient = useMemo(() => {
    if (!isDarkMode) return LIGHT_SPREAD_FILL;

    const outer = opacity(color, 0.18);
    const middle = opacity(color, 0.08);
    const inner = opacity(color, 0);
    return [outer, middle, inner, inner, middle, outer] as const;
  }, [color, isDarkMode]);

  return (
    <View style={isDarkMode ? undefined : styles.spreadShadow}>
      <View
        style={[
          styles.surface,
          { backgroundColor: isDarkMode ? opacity(color, 0.2) : undefined },
          isDarkMode ? undefined : styles.tightShadow,
        ]}
      >
        <View pointerEvents="none" style={styles.background}>
          <LinearGradient colors={gradient} locations={isDarkMode ? SPREAD_VERTICAL_STOPS : undefined} style={StyleSheet.absoluteFill} />
          {isDarkMode ? (
            <LinearGradient
              colors={gradient}
              locations={SPREAD_HORIZONTAL_STOPS}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          ) : null}
        </View>

        <View style={styles.content}>
          <Text align="center" color={{ custom: isDarkMode ? white(0.6) : globalColors.grey70 }} size="12pt" weight="heavy">
            {line > 0 ? `+${line}` : line}
          </Text>
          <AnimatedText align="center" color={isDarkMode ? 'white' : 'label'} size="13pt" weight="heavy" selector={formatProbability}>
            {price}
          </AnimatedText>
        </View>

        <Border
          borderRadius={14}
          borderWidth={isDarkMode ? 2 : THICK_BORDER_WIDTH}
          borderColor={{ custom: isDarkMode ? opacity(color, 0.06) : globalColors.white100 }}
          enableInLightMode
        />
      </View>
    </View>
  );
}

// ============ Formatting ===================================================== //

function formatProbability(price: ReadOnlySharedValue<string | undefined>): string {
  'worklet';
  return price.value === undefined ? '—' : `${roundWorklet(toPercentageWorklet(price.value))}%`;
}

// ============ Styles ========================================================= //

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
