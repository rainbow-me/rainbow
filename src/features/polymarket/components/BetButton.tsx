import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';

import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { globalColors } from '@/design-system/color/palettes';
import { Border } from '@/design-system/components/Border/Border';
import { AnimatedText } from '@/design-system/components/Text/AnimatedText';
import { formatPayoutMultiple } from '@/features/polymarket/utils/formatPayoutMultiple';
import { formatProbability } from '@/features/polymarket/utils/formatProbability';
import { useStoreSharedValue } from '@/state/internal/hooks/useStoreSharedValue';
import { useLiveTokensStore } from '@/state/liveTokens/liveTokensStore';
import { black, getSolidColorEquivalent, white } from '@/worklets/colors';

// ============ Constants ====================================================== //

const BUTTON_WIDTH = 60;
const BUTTON_HEIGHT = 40;
const BUTTON_BORDER_RADIUS = 14;

const PRIMARY_HIGHLIGHT_STOPS = [0, 0.25, 0.5, 0.75, 1] as const;
const PRIMARY_HIGHLIGHT = [white(0.12), white(0.055), white(0.018), white(0.004), white(0)] as const;

// ============ Bet Button ===================================================== //

/**
 * A bet button displaying implied probability and the payout multiple.
 */
export const BetButton = memo(function BetButton({
  liveTokenId,
  fallbackPrice,
  isDarkMode,
  color = globalColors.grey60,
  onPress,
}: {
  /** Live-token ID whose price feed is managed by the caller. */
  liveTokenId: string;
  /** Price used when no live quote is available. */
  fallbackPrice?: string | number;
  isDarkMode: boolean;
  color?: string;
  onPress: (color: string) => void;
}) {
  const price = useStoreSharedValue(useLiveTokensStore, s => s.tokens[liveTokenId]?.price);

  const backgroundColor = useMemo(
    () => getSolidColorEquivalent({ background: color, foreground: globalColors.grey100, opacity: isDarkMode ? 0.3 : 0.06 }),
    [color, isDarkMode]
  );

  const probability = useDerivedValue(() => formatProbability(price.value ?? fallbackPrice));
  const multiple = useDerivedValue(() => formatPayoutMultiple(price.value ?? fallbackPrice));
  const multipleStyle = useAnimatedStyle(() => ({ display: multiple.value ? 'flex' : 'none' }));

  return (
    <ButtonPressAnimation
      hitSlop={{ top: 1, bottom: 1 }}
      onPress={event => {
        event?.stopPropagation();
        onPress(color);
      }}
      scaleTo={0.925}
    >
      <View style={[styles.surface, { backgroundColor }]}>
        <View pointerEvents="none" style={styles.background}>
          <LinearGradient colors={PRIMARY_HIGHLIGHT} locations={PRIMARY_HIGHLIGHT_STOPS} style={styles.highlight} />
        </View>

        <View style={styles.content}>
          <AnimatedText align="center" color="white" size="13pt" style={styles.text} weight="heavy">
            {probability}
          </AnimatedText>
          <Animated.View style={multipleStyle}>
            <AnimatedText align="center" color={{ custom: globalColors.white80 }} size="11pt" style={styles.text} weight="bold">
              {multiple}
            </AnimatedText>
          </Animated.View>
        </View>

        <Border
          borderRadius={BUTTON_BORDER_RADIUS}
          borderWidth={2}
          borderColor={{ custom: (isDarkMode ? white : black)(0.1) }}
          enableInLightMode
        />
      </View>
    </ButtonPressAnimation>
  );
});

// ============ Styles ========================================================= //

const styles = StyleSheet.create({
  surface: {
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
    borderRadius: BUTTON_BORDER_RADIUS,
    borderCurve: 'continuous',
    shadowColor: globalColors.grey100,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  text: {
    textShadowColor: black(0.15),
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
