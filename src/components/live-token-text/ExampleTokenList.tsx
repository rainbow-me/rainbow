import React, { useRef, useCallback } from 'react';
import { FlatList, ListRenderItemInfo, ViewToken } from 'react-native';
import { useRoute } from '@react-navigation/native';

import { useLiveTokensStore } from '@/state/liveTokens/liveTokensStore';
import { LiveTokenText } from '@/components/live-token-text/LiveTokenText';
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
  const addSubscribedTokens = useLiveTokensStore(state => state.addSubscribedTokens);
  const removeSubscribedTokens = useLiveTokensStore(state => state.removeSubscribedTokens);

  const visibleTokenIdsRef = useRef<string[]>([]);

  useListen(
    useNavigationStore,
    state => state.activeRoute,
    activeRoute => {
      if (activeRoute === route.name) {
        addSubscribedTokens({ route: activeRoute, tokenIds: visibleTokenIdsRef.current });
      } else {
        removeSubscribedTokens({ route: activeRoute, tokenIds: visibleTokenIdsRef.current });
      }
    }
  );

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    visibleTokenIdsRef.current = viewableItems.map(viewToken => viewToken.item.id);
  }, []);

  const handleMomentumScrollEnd = useCallback(() => {
    addSubscribedTokens({ route: route.name, tokenIds: visibleTokenIdsRef.current });
  }, [addSubscribedTokens, route.name]);

  const renderItem = useCallback(({ item }: ListRenderItemInfo<TokenData>) => {
    return (
      <LiveTokenText
        size={'17pt'}
        color={'label'}
        tokenId={item.id}
        initialValueLastUpdated={item.price.lastUpdated}
        initialValue={item.price.price}
        selector={item => item.price}
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
