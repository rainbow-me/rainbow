import { useColorMode } from '@/design-system';
import { KingOfTheHill, KingOfTheHillRankingElem } from '@/graphql/__generated__/metadata';
import { usePrevious } from '@/hooks';
import Routes from '@/navigation/routesNames';
import { Skeleton } from '@/screens/points/components/Skeleton';
import { useKingOfTheHillStore } from '@/state/kingOfTheHill/kingOfTheHillStore';
import { useNavigationStore } from '@/state/navigation/navigationStore';
import { LegendList } from '@legendapp/list';
import chroma from 'chroma-js';
import { dequal } from 'dequal';
import makeColorMoreChill from 'make-color-more-chill';
import React, { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from './Header';
import { LeaderboardItem } from './LeaderboardItem';

function SyncStoreEnabled() {
  const activeSwipeRoute = useNavigationStore(state => state.activeSwipeRoute);
  const previousActiveSwipeRoute = usePrevious(activeSwipeRoute);

  if (activeSwipeRoute === Routes.KING_OF_THE_HILL && previousActiveSwipeRoute !== Routes.KING_OF_THE_HILL) {
    useKingOfTheHillStore.setState({
      enabled: true,
    });
  }
  return null;
}

export const KingOfTheHillContent = ({
  scrollY,
  onColorExtracted,
}: {
  scrollY?: SharedValue<number>;
  onColorExtracted?: (color: string | null) => void;
}) => {
  const { kingOfTheHill, kingOfTheHillLeaderBoard } = useKingOfTheHillStore(store => store.getData(), dequal) || {};
  const { isDarkMode } = useColorMode();
  const [backgroundColor, setBackgroundColor] = useState<string | null>(null);
  const { top: topInset } = useSafeAreaInsets();

  const handleColorExtracted = useCallback(
    (color: string | null) => {
      try {
        if (color) {
          const chillColor = makeColorMoreChill(color);
          const adjustedColor = isDarkMode
            ? chroma(chillColor).darken(3.5).desaturate(1.5).alpha(0.8).css()
            : chroma(chillColor).brighten(2).desaturate(1.5).alpha(0.8).css();
          setBackgroundColor(adjustedColor);
          onColorExtracted?.(adjustedColor);
        }
      } catch (error) {
        console.warn('Error adjusting color:', error);
        setBackgroundColor(null);
        onColorExtracted?.(null);
      }
    },
    [isDarkMode, onColorExtracted]
  );

  type HeaderItem = {
    type: 'header';
    data: KingOfTheHill;
  };

  type LeaderboardListItem = {
    type: 'item';
    ranking: number;
    token: KingOfTheHillRankingElem['token'];
    windowTradingVolume: string;
  };

  type BottomPadItem = {
    type: 'bottom-pad';
  };

  type ListItem = HeaderItem | LeaderboardListItem | BottomPadItem;

  const listData = useMemo(() => {
    const data: ListItem[] = [];

    if (kingOfTheHill) {
      data.push({
        type: 'header',
        data: kingOfTheHill,
      });
    }

    if (kingOfTheHillLeaderBoard?.rankings) {
      kingOfTheHillLeaderBoard.rankings
        .filter(item => item.rank > 1) // Start from 2nd place
        .forEach(item => {
          data.push({
            type: 'item',
            ranking: item.rank,
            token: item.token,
            windowTradingVolume: item.windowTradingVolume,
          });
        });
    }

    // Add bottom padding item
    data.push({ type: 'bottom-pad' });

    return data;
  }, [kingOfTheHill, kingOfTheHillLeaderBoard]);

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.type === 'header') {
        return (
          <View style={{ borderRadius: 20, padding: 20 }}>
            <Header kingOfTheHill={item.data} onColorExtracted={handleColorExtracted} />
          </View>
        );
      }

      if (item.type === 'bottom-pad') {
        return <View style={{ height: 100 }} />;
      }

      const priceChange = item.token.price?.relativeChange24h
        ? `${item.token.price.relativeChange24h > 0 ? '+' : ''}${(item.token.price.relativeChange24h * 100).toFixed(2)}%`
        : 'N/A';

      const price = item.token.price?.value
        ? `$${item.token.price.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`
        : 'N/A';

      const volume = item.windowTradingVolume ? `$${Math.round(parseFloat(item.windowTradingVolume)).toLocaleString()}` : 'N/A';

      const marketCap = item.token.marketCap ? `$${(item.token.marketCap / 1000000).toFixed(1)}M` : 'N/A';

      return (
        <LeaderboardItem
          token={item.token}
          ranking={item.ranking}
          priceChange={priceChange}
          volume={volume}
          marketCap={marketCap}
          price={price}
        />
      );
    },
    [handleColorExtracted]
  );

  const keyExtractor = useCallback((item: ListItem) => {
    if (item.type === 'header') return 'header';
    if (item.type === 'bottom-pad') return 'bottom-pad';
    return `${item.token.address}-${item.token.chainId}`;
  }, []);

  const handleScroll = useCallback(
    (event: any) => {
      if (scrollY) {
        scrollY.value = event.nativeEvent.contentOffset.y;
      }
    },
    [scrollY]
  );

  if (!kingOfTheHill && !kingOfTheHillLeaderBoard) {
    return (
      <View style={{ flex: 1, backgroundColor: backgroundColor || undefined }}>
        <View style={{ borderRadius: 20, padding: 20, marginTop: topInset + 40 }}>
          <Skeleton width={'100%'} height={400} />
        </View>
        <SyncStoreEnabled />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: backgroundColor || undefined }}>
      <LegendList
        data={listData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        onScroll={scrollY ? handleScroll : undefined}
        contentContainerStyle={{ paddingTop: topInset + 40 }}
        style={{ zIndex: 1 }}
      />
      <SyncStoreEnabled />
    </View>
  );
};
