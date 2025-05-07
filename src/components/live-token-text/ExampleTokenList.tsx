import React, { useRef, useCallback } from 'react';
import { FlatList, ListRenderItemInfo, ViewToken } from 'react-native';
import { useRoute } from '@react-navigation/native';

import { useLivePricingStore } from '@/state/livePrices/livePricesStore';
import { LivePriceText } from '@/components/live-token-text/LivePriceText';
import { useListen } from '@/state/internal/useListen';
import { useNavigationStore } from '@/state/navigation/navigationStore';

interface TokenData {
  id: string;
  name: string;
  symbol: string;
  price: {
    price: string;
    lastUpdated: number;
  };
}

interface TokenListProps {
  tokens: TokenData[];
}

export const ExampleTokenList: React.FC<TokenListProps> = ({ tokens }) => {
  const route = useRoute();
  const addSubscribedTokens = useLivePricingStore(state => state.addSubscribedTokens);
  const removeSubscribedTokens = useLivePricingStore(state => state.removeSubscribedTokens);

  const visibleTokenIdsRef = useRef<string[]>([]);

  useListen(
    useNavigationStore,
    state => state.activeRoute,
    activeRoute => {
      if (activeRoute === route.name) {
        addSubscribedTokens(visibleTokenIdsRef.current);
      } else {
        removeSubscribedTokens(visibleTokenIdsRef.current);
      }
    }
  );

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    visibleTokenIdsRef.current = viewableItems.map(viewToken => viewToken.item.id);
  }, []);

  const handleMomentumScrollEnd = useCallback(() => {
    addSubscribedTokens(visibleTokenIdsRef.current);
  }, [addSubscribedTokens]);

  const renderItem = useCallback(({ item }: ListRenderItemInfo<TokenData>) => {
    return (
      <LivePriceText
        size={'17pt'}
        color={'label'}
        tokenId={item.id}
        initialPrice={{ price: item.price.price, lastUpdated: item.price.lastUpdated }}
        autoSubscriptionEnabled={false}
      />
    );
  }, []);

  const keyExtractor = useCallback((item: TokenData) => item.id, []);

  return (
    <FlatList
      data={tokens}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      viewabilityConfig={{
        itemVisiblePercentThreshold: 50,
        waitForInteraction: true,
      }}
      onViewableItemsChanged={onViewableItemsChanged}
      onMomentumScrollEnd={handleMomentumScrollEnd}
    />
  );
};
