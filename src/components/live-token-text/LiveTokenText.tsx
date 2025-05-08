import React, { useCallback, useEffect } from 'react';
import { AnimatedText, AnimatedTextProps } from '@/design-system';
import { useLivePricingStore, addSubscribedToken, removeSubscribedToken, TokenData } from '@/state/livePrices/livePricesStore';
import { useSharedValue } from 'react-native-reanimated';
import { useListen } from '@/state/internal/useListen';
import { useRoute } from '@react-navigation/native';

interface LiveTokenTextProps extends AnimatedTextProps {
  tokenId: string;
  initialValueLastUpdated: number;
  initialValue: string;
  autoSubscriptionEnabled?: boolean;
  selector: (token: TokenData, prevToken: TokenData) => string;
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

  const onTokenUpdated = useCallback(
    (token: TokenData, prevToken: TokenData) => {
      if (token.lastUpdated > initialValueLastUpdated) {
        // TODO: Only want to set if the value we're interested in has changed
        liveValue.value = selector(token, prevToken);
      }
    },
    [initialValueLastUpdated, liveValue, selector]
  );

  useListen(useLivePricingStore, state => state.tokens[tokenId], onTokenUpdated);

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
