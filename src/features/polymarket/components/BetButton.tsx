import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';

import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { globalColors } from '@/design-system/color/palettes';
import { Border } from '@/design-system/components/Border/Border';
import { AnimatedText } from '@/design-system/components/Text/AnimatedText';
import { Text } from '@/design-system/components/Text/Text';
import { textSizes } from '@/design-system/typography/typography';
import { roundWorklet, toPercentageWorklet } from '@/framework/core/safeMath';
import { useStoreSharedValue, type ReadOnlySharedValue } from '@/state/internal/hooks/useStoreSharedValue';
import { useLiveTokensStore } from '@/state/liveTokens/liveTokensStore';
import { THICK_BORDER_WIDTH } from '@/styles/constants';
import { black, createOpacityPalette, getSolidColorEquivalent, white } from '@/worklets/colors';

// ============ Types ========================================================== //

type BetContentProps = {
  color: string;
  fallbackPrice?: string | number;
  isDarkMode: boolean;
  price: ReadOnlySharedValue<string | undefined>;
};

// ============ Constants ====================================================== //

const SMALL_PROBABILITY_STYLE = textSizes['15pt'];
const PROBABILITY_STYLE = textSizes['17pt'];

const BUTTON_WIDTH = 60;
const BUTTON_HEIGHT = 40;
const BUTTON_BORDER_RADIUS = 14;

const SPREAD_VERTICAL_STOPS = [0, 4 / BUTTON_HEIGHT, 12 / BUTTON_HEIGHT, 28 / BUTTON_HEIGHT, 36 / BUTTON_HEIGHT, 1] as const;
const SPREAD_HORIZONTAL_STOPS = [0, 4 / BUTTON_WIDTH, 12 / BUTTON_WIDTH, 48 / BUTTON_WIDTH, 56 / BUTTON_WIDTH, 1] as const;
const PRIMARY_HIGHLIGHT_STOPS = [0, 0.25, 0.5, 0.75, 1] as const;

const LIGHT_SPREAD_FILL = [white(0.54), white(0.81)] as const;
const PRIMARY_HIGHLIGHT = [white(0.12), white(0.055), white(0.018), white(0.004), white(0)] as const;

// ============ Bet Button ===================================================== //

/**
 * A bet button displaying live odds and an optional spread.
 */
export const BetButton = memo(function BetButton({
  liveTokenId,
  fallbackPrice,
  isDarkMode,
  color = globalColors.grey60,
  line,
  onPress,
}: {
  /** Live-token ID whose price feed is managed by the caller. */
  liveTokenId: string;
  /** Price used when no live quote is available. */
  fallbackPrice?: string | number;
  isDarkMode: boolean;
  color?: string;
  line?: number;
  onPress: (color: string) => void;
}) {
  const price = useStoreSharedValue(useLiveTokensStore, s => s.tokens[liveTokenId]?.price);

  return (
    <ButtonPressAnimation
      hitSlop={{ top: 1, bottom: 1 }}
      onPress={event => {
        event?.stopPropagation();
        onPress(color);
      }}
      scaleTo={0.925}
    >
      {line === undefined ? (
        <PrimaryBet color={color} isDarkMode={isDarkMode} price={price} fallbackPrice={fallbackPrice} />
      ) : (
        <SpreadBet color={color} isDarkMode={isDarkMode} price={price} fallbackPrice={fallbackPrice} line={line} />
      )}
    </ButtonPressAnimation>
  );
});

// ============ Bet Content ==================================================== //

function PrimaryBet({ color, isDarkMode, price, fallbackPrice }: BetContentProps) {
  const backgroundColor = useMemo(
    () => getSolidColorEquivalent({ background: color, foreground: globalColors.grey100, opacity: isDarkMode ? 0.3 : 0.06 }),
    [color, isDarkMode]
  );

  const probability = useDerivedValue(() => formatProbability(price, fallbackPrice));
  const probabilityStyle = useAnimatedStyle(() => (probability.value === '100%' ? SMALL_PROBABILITY_STYLE : PROBABILITY_STYLE));

  return (
    <View style={[styles.surface, { backgroundColor }, styles.primaryShadow]}>
      <View pointerEvents="none" style={styles.background}>
        <LinearGradient colors={PRIMARY_HIGHLIGHT} locations={PRIMARY_HIGHLIGHT_STOPS} style={styles.highlight} />
      </View>

      <View style={styles.content}>
        <AnimatedText align="center" color="white" size="17pt" style={[probabilityStyle, styles.primaryText]} weight="heavy">
          {probability}
        </AnimatedText>
      </View>

      <Border
        borderRadius={BUTTON_BORDER_RADIUS}
        borderWidth={2}
        borderColor={{ custom: (isDarkMode ? white : black)(0.1) }}
        enableInLightMode
      />
    </View>
  );
}

function SpreadBet({ color, isDarkMode, price, fallbackPrice, line }: BetContentProps & { line: number }) {
  const { backgroundColor, borderColor, gradient } = useMemo(() => {
    if (!isDarkMode) return { backgroundColor: undefined, borderColor: globalColors.white100, gradient: LIGHT_SPREAD_FILL };

    const palette = createOpacityPalette(color, [0, 6, 8, 18, 20]);
    const outer = palette.opacity18;
    const middle = palette.opacity8;
    const inner = palette.opacity0;

    return {
      backgroundColor: palette.opacity20,
      borderColor: palette.opacity6,
      gradient: [outer, middle, inner, inner, middle, outer] as const,
    };
  }, [color, isDarkMode]);

  return (
    <View style={isDarkMode ? undefined : styles.spreadShadow}>
      <View style={[styles.surface, { backgroundColor }, isDarkMode ? undefined : styles.tightShadow]}>
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
          <AnimatedText
            align="center"
            color={isDarkMode ? 'white' : 'label'}
            size="13pt"
            weight="heavy"
            selector={price => {
              'worklet';
              return formatProbability(price, fallbackPrice);
            }}
          >
            {price}
          </AnimatedText>
        </View>

        <Border
          borderRadius={BUTTON_BORDER_RADIUS}
          borderWidth={isDarkMode ? 2 : THICK_BORDER_WIDTH}
          borderColor={{ custom: borderColor }}
          enableInLightMode
        />
      </View>
    </View>
  );
}

// ============ Formatting ===================================================== //

function formatProbability(price: ReadOnlySharedValue<string | undefined>, fallbackPrice?: string | number): string {
  'worklet';
  const value = price.value ?? fallbackPrice;
  return value === undefined ? '–' : `${roundWorklet(toPercentageWorklet(value))}%`;
}

// ============ Styles ========================================================= //

const styles = StyleSheet.create({
  surface: {
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
    borderRadius: BUTTON_BORDER_RADIUS,
    borderCurve: 'continuous',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BUTTON_BORDER_RADIUS,
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
  primaryShadow: {
    shadowColor: globalColors.grey100,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  spreadShadow: {
    borderRadius: BUTTON_BORDER_RADIUS,
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
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 6 },
  primaryText: {
    textShadowColor: black(0.15),
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
