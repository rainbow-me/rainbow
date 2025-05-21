import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatedText, AnimatedTextProps, useForegroundColor } from '@/design-system';
import { useLiveTokensStore, addSubscribedToken, removeSubscribedToken, TokenData } from '@/state/liveTokens/liveTokensStore';
import { useSharedValue, SharedValue, useAnimatedStyle, useAnimatedReaction, withTiming, withDelay } from 'react-native-reanimated';
import { useListen } from '@/state/internal/hooks/useListen';
import { useRoute } from '@react-navigation/native';

interface LiveTokenValueParams {
  tokenId: string;
  initialValueLastUpdated: number;
  initialValue: string;
  autoSubscriptionEnabled?: boolean;
  selector: (token: TokenData) => string;
}

const toUnixTime = (date: string) => new Date(date).getTime() / 1000;

export function useLiveTokenSharedValue({
  tokenId,
  initialValueLastUpdated,
  initialValue,
  autoSubscriptionEnabled = true,
  selector,
}: LiveTokenValueParams): SharedValue<string> {
  const { name: routeName } = useRoute();
  const liveValue = useSharedValue(initialValue);
  // prevValue and liveValue will always be equal, but there is a cost to reading shared values
  const prevValue = useRef(initialValue);

  const onTokenUpdated = useCallback(
    (token: TokenData) => {
      // TODO: would need selector to be worklet too, does it matter in this case of setting singular value?
      // 'worklet';
      const newValue = selector(token);

      if (toUnixTime(token.updatedAt) > initialValueLastUpdated && newValue !== prevValue.current) {
        liveValue.value = newValue;
        prevValue.current = newValue;
      }
    },
    [initialValueLastUpdated, liveValue, selector]
  );

  useListen(useLiveTokensStore, state => state.tokens[tokenId], onTokenUpdated);

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
  initialValueLastUpdated,
  initialValue,
  autoSubscriptionEnabled = true,
  selector,
}: LiveTokenValueParams): string {
  const { name: routeName } = useRoute();
  const [liveValue, setLiveValue] = useState(initialValue);
  // prevLiveValue and liveValue will always be equal, but state is async
  const prevLiveValue = useRef(initialValue);

  const onTokenUpdated = useCallback(
    (token: TokenData) => {
      const newValue = selector(token);

      if (toUnixTime(token.updatedAt) > initialValueLastUpdated && newValue !== prevLiveValue.current) {
        setLiveValue(newValue);
        prevLiveValue.current = newValue;
      }
    },
    [initialValueLastUpdated, selector]
  );

  useListen(useLiveTokensStore, state => state.tokens[tokenId], onTokenUpdated);

  useEffect(() => {
    if (!autoSubscriptionEnabled) return;

    addSubscribedToken({ route: routeName, tokenId });

    return () => {
      removeSubscribedToken({ route: routeName, tokenId });
    };
  }, [autoSubscriptionEnabled, routeName, tokenId]);

  return liveValue;
}

type LiveTokenTextProps = LiveTokenValueParams & AnimatedTextProps;

export const LiveTokenText: React.FC<LiveTokenTextProps> = React.memo(function LiveTokenText({
  tokenId,
  initialValueLastUpdated,
  initialValue,
  autoSubscriptionEnabled = true,
  selector,
  ...textProps
}) {
  const liveValue = useLiveTokenSharedValue({
    tokenId,
    initialValueLastUpdated,
    initialValue,
    autoSubscriptionEnabled,
    selector,
  });

  const baseColor = useForegroundColor(textProps.color ?? 'label');
  const textColor = useSharedValue(baseColor);

  useAnimatedReaction(
    () => liveValue.value,
    (value, previousValue) => {
      if (!previousValue || value === previousValue) return;

      let animateToColor = baseColor;
      if (value > previousValue) {
        animateToColor = 'green';
      } else if (value < previousValue) {
        animateToColor = 'red';
      }

      textColor.value = withTiming(animateToColor, { duration: 250 }, () => {
        textColor.value = withDelay(250, withTiming(baseColor, { duration: 250 }));
      });
    }
  );

  const textStyle = useAnimatedStyle(() => {
    return {
      color: textColor.value,
    };
  });

  return (
    <AnimatedText {...textProps} style={[textStyle, textProps.style]}>
      {liveValue}
    </AnimatedText>
  );
});
