import React, { useEffect } from 'react';
import { AnimatedText, AnimatedTextProps } from '@/design-system';
import { useLivePricingStore, addSubscribedToken, removeSubscribedToken } from '@/state/livePrices/livePricesStore';
import { useSharedValue } from 'react-native-reanimated';
import { useListen } from '@/state/internal/useListen';

interface LivePriceTextProps extends AnimatedTextProps {
  tokenId: string;
  initialPrice: {
    price: string;
    lastUpdated: number;
  };
  autoSubscriptionEnabled?: boolean;
  activeRoutes?: string[];
}

export const LivePriceText: React.FC<LivePriceTextProps> = React.memo(function LivePriceText({
  tokenId,
  initialPrice,
  autoSubscriptionEnabled = true,
  activeRoutes,
  ...textProps
}) {
  const livePrice = useSharedValue(initialPrice.price);

  useListen(
    useLivePricingStore,
    state => state.tokens[tokenId],
    (token, prevToken) => {
      // TODO: only update if price has changed and is newer than the initial price
      livePrice.value = token.price;
    }
  );

  useEffect(() => {
    if (!autoSubscriptionEnabled) return;

    // TODO: get the route this component is mounted in
    addSubscribedToken({ route: '', tokenId });

    return () => {
      removeSubscribedToken({ route: '', tokenId });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AnimatedText
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...textProps}
    >
      {livePrice}
    </AnimatedText>
  );
});
