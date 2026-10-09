import React, { useEffect, useMemo } from 'react';

import { useAnimatedReaction, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { AnimatedText, useForegroundColor, type TextProps } from '@/design-system';
import { useRoute } from '@/navigation/RouteContext';
import { useStoreSharedValue, type ReadOnlySharedValue } from '@/state/internal/hooks/useStoreSharedValue';
import { useLiveTokensStore, type LiveTokensData, type TokenData } from '@/state/liveTokens/liveTokensStore';
import { useTheme } from '@/theme/ThemeContext';
import { toUnixTime } from '@/worklets/dates';

interface LiveTokenValueParams {
  tokenId: string;
  /**
   * Timestamp of the initial value, in Unix seconds. Defaults to `0`.
   * Live quotes take precedence when timestamps match.
   */
  initialValueLastUpdated?: number;
  /** Display value used when the live quote is absent or older than the initial value. */
  initialValue: string;
  /**
   * Subscribes to this token on the current route. Disable when the caller manages
   * the price subscription. Defaults to `true`.
   */
  autoSubscriptionEnabled?: boolean;
  selector: (token: TokenData) => string;
  testId?: string;
}

/**
 * Returns the selected token value as a shared value.
 */
export function useLiveTokenSharedValue(params: LiveTokenValueParams): ReadOnlySharedValue<string> {
  const selector = useLiveTokenSelector(params);
  return useStoreSharedValue(useLiveTokensStore, selector);
}

/**
 * Returns the selected token value as React state.
 */
export function useLiveTokenValue(params: LiveTokenValueParams): string {
  const selector = useLiveTokenSelector(params);
  return useLiveTokensStore(selector);
}

function useLiveTokenSelector({
  tokenId,
  initialValue,
  initialValueLastUpdated = 0,
  autoSubscriptionEnabled = true,
  selector,
}: LiveTokenValueParams): (state: { tokens: LiveTokensData }) => string {
  const { name: route } = useRoute();

  useEffect(() => {
    if (!autoSubscriptionEnabled) return;
    return useLiveTokensStore.getState().subscribeToToken(route, tokenId);
  }, [autoSubscriptionEnabled, route, tokenId]);

  return useMemo(() => {
    let previousToken: TokenData | undefined;
    let value = initialValue;

    return (s: { tokens: LiveTokensData }) => {
      const token = s.tokens[tokenId];
      if (token !== previousToken) {
        previousToken = token;
        value = token && toUnixTime(token.updateTime) >= initialValueLastUpdated ? selector(token) : initialValue;
      }
      return value;
    };
  }, [initialValue, initialValueLastUpdated, selector, tokenId]);
}

type LiveTokenTextProps = LiveTokenValueParams &
  Omit<TextProps, 'children' | 'ref'> & {
    animateTrendChange?: boolean;
  } & (
    | {
        isPriceChangeColorEnabled?: boolean;
        priceChangeChangeColors?: {
          positive?: string;
          negative?: string;
          neutral?: string;
        };
      }
    | {
        isPriceChangeColorEnabled?: false;
        priceChangeChangeColors?: undefined;
      }
  );

export const LiveTokenText: React.FC<LiveTokenTextProps> = React.memo(function LiveTokenText({
  tokenId,
  initialValueLastUpdated,
  initialValue,
  autoSubscriptionEnabled = true,
  selector,
  animateTrendChange = false,
  isPriceChangeColorEnabled = false,
  priceChangeChangeColors,
  testId,
  ...textProps
}) {
  const liveValue = useLiveTokenSharedValue({
    tokenId,
    initialValueLastUpdated,
    initialValue,
    autoSubscriptionEnabled,
    selector,
    testId,
  });

  const theme = useTheme();
  const positiveThemeColor = theme.colors.green;
  const negativeThemeColor = theme.colors.red;
  const positivePriceChangeColor = priceChangeChangeColors?.positive;
  const negativePriceChangeColor = priceChangeChangeColors?.negative;
  const neutralPriceChangeColor = priceChangeChangeColors?.neutral;

  const baseColor = useForegroundColor(textProps.color ?? 'label');
  const textColor = useSharedValue(baseColor);

  useAnimatedReaction(
    () => liveValue.value,
    (value, previousValue) => {
      if (isPriceChangeColorEnabled) {
        if (parseFloat(value) > 0) {
          textColor.value = positivePriceChangeColor ?? positiveThemeColor;
        } else if (parseFloat(value) < 0) {
          textColor.value = negativePriceChangeColor ?? negativeThemeColor;
        } else {
          textColor.value = neutralPriceChangeColor ?? baseColor;
        }
        return;
      }

      if (!animateTrendChange || !previousValue || value === previousValue) return;

      let animateToColor = baseColor;
      if (value > previousValue) {
        animateToColor = positiveThemeColor;
      } else if (value < previousValue) {
        animateToColor = negativeThemeColor;
      }

      textColor.value = withTiming(animateToColor, { duration: 150 }, () => {
        textColor.value = withDelay(50, withTiming(baseColor, { duration: 150 }));
      });
    },
    [
      animateTrendChange,
      baseColor,
      negativePriceChangeColor,
      negativeThemeColor,
      neutralPriceChangeColor,
      positivePriceChangeColor,
      positiveThemeColor,
      isPriceChangeColorEnabled,
    ]
  );

  useEffect(() => {
    if (isPriceChangeColorEnabled) {
      const numericValue = parseFloat(liveValue.value);

      if (numericValue > 0) {
        textColor.value = positivePriceChangeColor ?? positiveThemeColor;
      } else if (numericValue < 0) {
        textColor.value = negativePriceChangeColor ?? negativeThemeColor;
      } else {
        textColor.value = neutralPriceChangeColor ?? baseColor;
      }

      return;
    }

    textColor.value = baseColor;
  }, [
    baseColor,
    liveValue,
    negativePriceChangeColor,
    negativeThemeColor,
    neutralPriceChangeColor,
    positivePriceChangeColor,
    positiveThemeColor,
    textColor,
    isPriceChangeColorEnabled,
  ]);

  const textStyle = useAnimatedStyle(() => {
    return {
      color: textColor.value,
    };
  });

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <AnimatedText testID={testId} {...textProps} style={textProps.style ? [textStyle, textProps.style] : textStyle}>
      {liveValue}
    </AnimatedText>
  );
});
