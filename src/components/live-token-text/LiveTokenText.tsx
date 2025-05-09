import React, { useCallback, useEffect, useRef } from 'react';
import { AnimatedText, AnimatedTextProps } from '@/design-system';
import { useLiveTokensStore, addSubscribedToken, removeSubscribedToken, TokenData } from '@/state/liveTokens/liveTokensStore';
import { useSharedValue } from 'react-native-reanimated';
import { useListen } from '@/state/internal/useListen';
import { useRoute } from '@react-navigation/native';

interface LiveTokenTextProps extends AnimatedTextProps {
  tokenId: string;
  initialValueLastUpdated: number;
  initialValue: string;
  autoSubscriptionEnabled?: boolean;
  selector: (token: TokenData) => string;
}

export const LiveTokenText: React.FC<LiveTokenTextProps> = React.memo(function LiveTokenText({
  tokenId,
  initialValueLastUpdated,
  initialValue,
  autoSubscriptionEnabled = true,
  selector,
  ...textProps
}) {
  const route = useRoute();
  const liveValue = useSharedValue(initialValue);
  // prevValue and liveValue will always be equal, but there is a cost to reading shared values
  const prevValue = useRef(initialValue);

  const onTokenUpdated = useCallback(
    (token: TokenData) => {
      // TODO: would need selector to be worklet too, does it matter in this case of setting singular value?
      // 'worklet';
      const newValue = selector(token);

      console.log(`[LiveTokenText] onTokenUpdated: ${tokenId}`, {
        newValue,
        prevValue,
      });

      if (token.lastUpdated > initialValueLastUpdated && newValue !== prevValue.current) {
        liveValue.value = newValue;
        prevValue.current = newValue;
      }
    },
    [initialValueLastUpdated, liveValue, selector, prevValue]
  );

  useListen(useLiveTokensStore, state => state.tokens[tokenId], onTokenUpdated, { debugMode: false });

  useEffect(() => {
    if (!autoSubscriptionEnabled) return;

    addSubscribedToken({ route: route.name, tokenId });

    return () => {
      removeSubscribedToken({ route: route.name, tokenId });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AnimatedText
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...textProps}
    >
      {liveValue}
    </AnimatedText>
  );
});
