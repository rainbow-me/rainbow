import React, { useCallback, useEffect, useLayoutEffect } from 'react';

import { useListen } from '@storesjs/stores';
import { useAnimatedReaction, useAnimatedStyle, useSharedValue, withDelay, withTiming, type SharedValue } from 'react-native-reanimated';

import { AnimatedText, useForegroundColor, type TextProps } from '@/design-system';
import { useStableValue } from '@/hooks/useStableValue';
import { useRoute } from '@/navigation/RouteContext';
import { useLiveTokensStore, type LiveTokensData, type TokenData } from '@/state/liveTokens/liveTokensStore';
import { useLiveTokenSubscription } from '@/state/liveTokens/useLiveTokenSubscription';
import { useTheme } from '@/theme/ThemeContext';
import { toUnixTime } from '@/worklets/dates';

interface LiveTokenValueParams {
  tokenId: string;
  initialValueLastUpdated?: number;
  initialValue: string;
  autoSubscriptionEnabled?: boolean;
  selector: (token: TokenData) => string;
  testId?: string;
}

export function useLiveTokenSharedValue({
  tokenId,
  initialValueLastUpdated = 0,
  initialValue,
  autoSubscriptionEnabled = true,
  selector,
}: LiveTokenValueParams): SharedValue<string> {
  const { name: routeName } = useRoute();
  const setSubscribedTokens = useLiveTokenSubscription(routeName);
  const selectValue = useCallback(
    ({ tokens }: { tokens: LiveTokensData }) => getTokenValue(tokens[tokenId], initialValue, initialValueLastUpdated, selector),
    [initialValue, initialValueLastUpdated, selector, tokenId]
  );
  const initial = useStableValue(() => selectValue(useLiveTokensStore.getState()));
  const liveValue = useSharedValue(initial);
  const updateValue = useCallback(
    (value: string) => {
      liveValue.value = value;
    },
    [liveValue]
  );

  useListen(useLiveTokensStore, selectValue, updateValue);

  useLayoutEffect(() => {
    updateValue(selectValue(useLiveTokensStore.getState()));
  }, [selectValue, updateValue]);

  useEffect(() => {
    setSubscribedTokens(autoSubscriptionEnabled ? [tokenId] : []);
  }, [autoSubscriptionEnabled, setSubscribedTokens, tokenId]);

  return liveValue;
}

export function useLiveTokenValue({
  tokenId,
  initialValueLastUpdated = 0,
  initialValue,
  autoSubscriptionEnabled = true,
  selector,
}: LiveTokenValueParams): string {
  const { name: routeName } = useRoute();
  const setSubscribedTokens = useLiveTokenSubscription(routeName);
  const liveValue = useLiveTokensStore(state => getTokenValue(state.tokens[tokenId], initialValue, initialValueLastUpdated, selector));

  useEffect(() => {
    setSubscribedTokens(autoSubscriptionEnabled ? [tokenId] : []);
  }, [autoSubscriptionEnabled, setSubscribedTokens, tokenId]);

  return liveValue;
}

function getTokenValue(
  token: TokenData | undefined,
  initialValue: string,
  initialValueLastUpdated: number,
  selector: LiveTokenValueParams['selector']
): string {
  return token && toUnixTime(token.updateTime) >= initialValueLastUpdated ? selector(token) : initialValue;
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
