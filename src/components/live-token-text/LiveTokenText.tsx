import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatedText, TextProps, useForegroundColor } from '@/design-system';
import { useTheme } from '@/theme';
import { useLiveTokensStore, addSubscribedToken, removeSubscribedToken, TokenData } from '@/state/liveTokens/liveTokensStore';
import { useSharedValue, SharedValue, useAnimatedStyle, useAnimatedReaction, withTiming, withDelay } from 'react-native-reanimated';
import { useListen } from '@/state/internal/hooks/useListen';
import { useRoute } from '@react-navigation/native';
import { toUnixTime } from '@/worklets/dates';

interface LiveTokenValueParams {
  tokenId: string;
  initialValueLastUpdated?: number;
  initialValue: string;
  autoSubscriptionEnabled?: boolean;
  selector: (token: TokenData) => string;
}

export function useLiveTokenSharedValue({
  tokenId,
  initialValueLastUpdated = 0,
  initialValue,
  autoSubscriptionEnabled = true,
  selector,
}: LiveTokenValueParams): SharedValue<string> {
  const { name: routeName } = useRoute();
  const liveValue = useSharedValue(initialValue);
  // prevValue and liveValue will always be equal, but there is a cost to reading shared values
  const prevValue = useRef(initialValue);

  const updateToken = useCallback(
    (token: TokenData) => {
      if (!token) return;

      const newValue = selector(token);

      if (toUnixTime(token.updateTime) > initialValueLastUpdated && newValue !== prevValue.current) {
        liveValue.value = newValue;
        prevValue.current = newValue;
      }
    },
    [initialValueLastUpdated, liveValue, selector]
  );

  useListen(useLiveTokensStore, state => state.tokens[tokenId], updateToken);

  // Immediately update value when selector changes
  useEffect(() => {
    updateToken(useLiveTokensStore.getState().tokens[tokenId]);
  }, [selector, tokenId, updateToken]);

  useEffect(() => {
    if (!autoSubscriptionEnabled) return;

    addSubscribedToken({ route: routeName, tokenId });

    return () => {
      removeSubscribedToken({ route: routeName, tokenId });
    };
  }, [autoSubscriptionEnabled, routeName, tokenId]);

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
  const [liveValue, setLiveValue] = useState(initialValue);
  // prevLiveValue and liveValue will always be equal, but state is async
  const prevLiveValue = useRef(initialValue);

  const updateToken = useCallback(
    (token: TokenData) => {
      if (!token) return;

      const newValue = selector(token);

      if (toUnixTime(token.updateTime) > initialValueLastUpdated && newValue !== prevLiveValue.current) {
        setLiveValue(newValue);
        prevLiveValue.current = newValue;
      }
    },
    [initialValueLastUpdated, selector]
  );

  useListen(useLiveTokensStore, state => state.tokens[tokenId], updateToken);

  // Immediately update value when selector changes
  useEffect(() => {
    updateToken(useLiveTokensStore.getState().tokens[tokenId]);
  }, [selector, tokenId, updateToken]);

  useEffect(() => {
    if (!autoSubscriptionEnabled) return;

    addSubscribedToken({ route: routeName, tokenId });

    return () => {
      removeSubscribedToken({ route: routeName, tokenId });
    };
  }, [autoSubscriptionEnabled, routeName, tokenId]);

  return liveValue;
}

type LiveTokenTextProps = LiveTokenValueParams &
  Omit<TextProps, 'children'> & {
    // TODO: do not like these prop names
    animateTrendChange?: boolean;
    usePriceChangeColor?: boolean;
    priceChangeChangeColors?: {
      positive?: string;
      negative?: string;
      neutral?: string;
    };
  };

export const LiveTokenText: React.FC<LiveTokenTextProps> = React.memo(function LiveTokenText({
  tokenId,
  initialValueLastUpdated,
  initialValue,
  autoSubscriptionEnabled = true,
  selector,
  animateTrendChange = false,
  usePriceChangeColor = false,
  priceChangeChangeColors,
  ...textProps
}) {
  const liveValue = useLiveTokenSharedValue({
    tokenId,
    initialValueLastUpdated,
    initialValue,
    autoSubscriptionEnabled,
    selector,
  });

  const theme = useTheme();

  const baseColor = useForegroundColor(textProps.color ?? 'label');
  const textColor = useSharedValue(baseColor);

  useAnimatedReaction(
    () => liveValue.value,
    (value, previousValue) => {
      if (usePriceChangeColor) {
        if (parseFloat(value) > 0) {
          textColor.value = priceChangeChangeColors?.positive ?? theme.colors.green;
        } else if (parseFloat(value) < 0) {
          textColor.value = priceChangeChangeColors?.negative ?? theme.colors.red;
        } else {
          textColor.value = priceChangeChangeColors?.neutral ?? baseColor;
        }
        return;
      }

      if (!animateTrendChange || !previousValue || value === previousValue) return;

      let animateToColor = baseColor;
      if (value > previousValue) {
        animateToColor = theme.colors.green;
      } else if (value < previousValue) {
        animateToColor = theme.colors.red;
      }

      textColor.value = withTiming(animateToColor, { duration: 150 }, () => {
        textColor.value = withDelay(50, withTiming(baseColor, { duration: 150 }));
      });
    }
  );

  const textStyle = useAnimatedStyle(() => {
    return {
      color: textColor.value,
    };
  });

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <AnimatedText {...textProps} style={[textStyle, textProps.style]}>
      {liveValue}
    </AnimatedText>
  );
});
