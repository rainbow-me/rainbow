import { Box, useColorMode } from '@/design-system';
import { KingOfTheHill, KingOfTheHillRankingElem } from '@/graphql/__generated__/metadata';
import { usePrevious } from '@/hooks';
import Routes from '@/navigation/routesNames';
import { Skeleton } from '@/screens/points/components/Skeleton';
import { useKingOfTheHillStore } from '@/state/kingOfTheHill/kingOfTheHillStore';
import { useNavigationStore } from '@/state/navigation/navigationStore';
import { LegendList } from '@legendapp/list';
import chroma from 'chroma-js';
import makeColorMoreChill from 'make-color-more-chill';
import React, { useCallback, useMemo, useState } from 'react';
import isEqual from 'react-fast-compare';
import { Header } from './Header';
import { LeaderboardItem } from './LeaderboardItem';

function SyncStoreEnabled() {
  const activeSwipeRoute = useNavigationStore(state => state.activeSwipeRoute);
  const previousActiveSwipeRoute = usePrevious(activeSwipeRoute);

  if (activeSwipeRoute === Routes.DISCOVER_SCREEN && previousActiveSwipeRoute !== Routes.DISCOVER_SCREEN) {
    useKingOfTheHillStore.setState({
      enabled: true,
    });
  }
  return null;
}

export const KingOfTheHillContent = () => {
  const { kingOfTheHill, kingOfTheHillLeaderBoard } = useKingOfTheHillStore(store => store.getData(), isEqual) || {};
  const { isDarkMode } = useColorMode();
  const [backgroundColor, setBackgroundColor] = useState<string | null>(null);

  const handleColorExtracted = useCallback(
    (color: string | null) => {
      try {
        if (color) {
          const chillColor = makeColorMoreChill(color);
          const adjustedColor = isDarkMode
            ? chroma(chillColor).darken(2.5).alpha(0.15).css()
            : chroma(chillColor).brighten(2).alpha(0.1).css();
          setBackgroundColor(adjustedColor);
        }
      } catch (error) {
        console.warn('Error adjusting color:', error);
        setBackgroundColor(null);
      }
    },
    [isDarkMode]
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

  type ListItem = HeaderItem | LeaderboardListItem;

  const listData = useMemo(() => {
    const data: ListItem[] = [];

    // Add header as first item
    if (kingOfTheHill) {
      data.push({
        type: 'header',
        data: kingOfTheHill,
      });
    }

    // Add leaderboard items
    if (kingOfTheHillLeaderBoard?.rankings) {
      kingOfTheHillLeaderBoard.rankings.forEach(item => {
        data.push({
          type: 'item',
          ranking: item.rank,
          token: item.token,
          windowTradingVolume: item.windowTradingVolume,
        });
      });
    }

    return data;
  }, [kingOfTheHill, kingOfTheHillLeaderBoard]);

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.type === 'header') {
        return (
          <Box backgroundColor={backgroundColor || undefined} borderRadius={20} padding="20px" marginBottom="12px">
            <Header kingOfTheHill={item.data} onColorExtracted={handleColorExtracted} />
          </Box>
        );
      }

      // Format real data for display
      const priceChange = item.token.price?.relativeChange24h
        ? `${item.token.price.relativeChange24h > 0 ? '+' : ''}${(item.token.price.relativeChange24h * 100).toFixed(2)}%`
        : 'N/A';

      const price = item.token.price?.value
        ? `$${item.token.price.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`
        : 'N/A';

      const volume = item.windowTradingVolume || 'N/A';

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
    [backgroundColor, handleColorExtracted]
  );

  const keyExtractor = useCallback((item: ListItem) => {
    if (item.type === 'header') return 'header';
    return `${item.token.address}-${item.token.chainId}`;
  }, []);

  if (!kingOfTheHill && !kingOfTheHillLeaderBoard) {
    return (
      <>
        <Box backgroundColor={backgroundColor || undefined} borderRadius={20} padding="20px">
          <Skeleton width={'100%'} height={400} />
        </Box>
        <SyncStoreEnabled />
      </>
    );
  }

  return (
    <>
      <LegendList data={listData} renderItem={renderItem} keyExtractor={keyExtractor} showsVerticalScrollIndicator={false} />
      <SyncStoreEnabled />
    </>
  );
};
