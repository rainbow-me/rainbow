import { DropdownMenu } from '@/components/DropdownMenu';
import { globalColors, Text, useBackgroundColor } from '@/design-system';
import { useForegroundColor } from '@/design-system/color/useForegroundColor';

import { SwapCoinIcon } from '@/__swaps__/screens/Swap/components/SwapCoinIcon';
import { analyticsV2 } from '@/analytics';
import { chainsLabel } from '@/chains';
import { ChainId } from '@/chains/types';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { NetworkSelector } from '@/components/NetworkSwitcher';
import Skeleton, { FakeAvatar, FakeText } from '@/components/skeleton/Skeleton';
import { TrendingCategory, TrendingSort } from '@/graphql/__generated__/arc';
import { formatCurrency, formatNumber } from '@/helpers/strings';
import * as i18n from '@/languages';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { FarcasterUser, TrendingToken, useTrendingTokens } from '@/resources/trendingTokens/trendingTokens';
import { useNavigationStore } from '@/state/navigation/navigationStore';
import { swapsStore } from '@/state/swaps/swapsStore';
import { sortFilters, timeFilters, useTrendingTokensStore } from '@/state/trendingTokens/trendingTokens';
import { colors } from '@/styles';
import { darkModeThemeColors } from '@/styles/colors';
import { useTheme } from '@/theme';
import { useCallback, useEffect, useMemo, useState } from 'react';
import React, { FlatList, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { LinearTransition, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { ButtonPressAnimation } from '../animations';
import { useFarcasterAccountForWallets } from '@/hooks/useFarcasterAccountForWallets';
import { ImgixImage } from '../images';

const t = i18n.l.trending_tokens;

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

function FilterButton({ icon, label, onPress }: { onPress?: VoidFunction; label: string; icon: string | JSX.Element }) {
  const pressed = useSharedValue(false);

  const tap = Gesture.Tap()
    .onBegin(() => {
      pressed.value = true;
      if (onPress) runOnJS(onPress)();
    })
    .onFinalize(() => (pressed.value = false));

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(pressed.value ? 0.95 : 1, { duration: 100 }) }],
  }));

  const backgroundColor = useBackgroundColor('fillTertiary');
  const borderColor = useBackgroundColor('fillSecondary');

  const iconColor = useForegroundColor('labelQuaternary');

  return (
    <GestureDetector gesture={tap}>
      <Animated.View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            height: 36,
            paddingHorizontal: 12,
            borderRadius: 18,
            borderWidth: 1.33,
            borderColor,
            backgroundColor,
          },
          animatedStyles,
        ]}
      >
        {typeof icon === 'string' ? (
          <Text color={{ custom: iconColor }} size="icon 13px" weight="heavy" style={{ width: 16 }}>
            {icon}
          </Text>
        ) : (
          icon
        )}
        <Text color="labelSecondary" size="17pt" weight="bold">
          {label}
        </Text>
        <Text color={{ custom: iconColor }} size="13pt" weight="bold" style={{ width: 14 }}>
          􀆏
        </Text>
      </Animated.View>
    </GestureDetector>
  );
}

function useTrendingTokensData() {
  const { chainId, category, timeframe, sort } = useTrendingTokensStore(state => ({
    chainId: state.chainId,
    category: state.category,
    timeframe: state.timeframe,
    sort: state.sort,
  }));

  const walletAddress = useFarcasterAccountForWallets();

  return useTrendingTokens({
    chainId,
    category,
    timeframe,
    sortBy: sort,
    sortDirection: undefined,
    walletAddress: walletAddress,
  });
}

function ReportAnalytics() {
  const activeSwipeRoute = useNavigationStore(state => state.activeSwipeRoute);
  const { category, chainId } = useTrendingTokensStore(state => ({ category: state.category, chainId: state.chainId }));
  const { data: trendingTokens, isLoading } = useTrendingTokensData();

  useEffect(() => {
    if (isLoading || activeSwipeRoute !== Routes.DISCOVER_SCREEN) return;

    const isEmpty = (trendingTokens?.length ?? 0) === 0;
    const isLimited = !isEmpty && (trendingTokens?.length ?? 0) < 6;

    analyticsV2.track(analyticsV2.event.viewRankedCategory, {
      category,
      chainId,
      isLimited,
      isEmpty,
    });
  }, [isLoading, activeSwipeRoute, trendingTokens?.length, category, chainId]);

  return null;
}

function CategoryFilterButton({
  category,
  icon,
  iconWidth = 16,
  iconColor,
  label,
  highlightedBackgroundColor,
}: {
  category: TrendingCategory;
  icon: string;
  iconColor: string;
  highlightedBackgroundColor: string;
  iconWidth?: number;
  label: string;
}) {
  const { isDarkMode } = useTheme();
  const fillTertiary = useBackgroundColor('fillTertiary');
  const fillSecondary = useBackgroundColor('fillSecondary');

  const selected = useTrendingTokensStore(state => state.category === category);

  const borderColor = selected && isDarkMode ? globalColors.white80 : fillSecondary;

  const pressed = useSharedValue(false);

  const selectCategory = useCallback(() => {
    useTrendingTokensStore.getState().setCategory(category);
  }, [category]);

  const tap = Gesture.Tap()
    .onBegin(() => {
      pressed.value = true;
    })
    .onEnd(() => {
      pressed.value = false;
      runOnJS(selectCategory)();
    });

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(pressed.value ? 0.95 : 1, { duration: 100 }) }],
  }));

  return (
    <GestureDetector gesture={tap}>
      <AnimatedLinearGradient
        colors={selected ? [highlightedBackgroundColor, 'white'] : [fillTertiary, fillTertiary]}
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            height: 36,
            paddingHorizontal: 12,
            borderRadius: 18,
            borderWidth: 1.33,
            borderColor,
          },
          animatedStyles,
        ]}
        layout={LinearTransition}
      >
        <Text color={{ custom: iconColor }} size="icon 13px" weight="heavy" style={{ width: iconWidth }}>
          {icon}
        </Text>
        <Text color={selected ? { custom: 'black' } : 'labelSecondary'} size="17pt" weight={selected ? 'heavy' : 'bold'}>
          {label}
        </Text>
      </AnimatedLinearGradient>
    </GestureDetector>
  );
}

function FriendPfp({ pfp_url }: { pfp_url: string }) {
  const backgroundColor = useBackgroundColor('surfacePrimary');
  return (
    <ImgixImage
      source={{ uri: pfp_url }}
      style={{
        height: 12 + 2,
        width: 12 + 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: backgroundColor,
        marginVertical: -1,
        marginLeft: -6,
      }}
    />
  );
}
function FriendHolders({ friends }: { friends: FarcasterUser[] }) {
  if (friends.length === 0) return null;
  return (
    <View style={{ flexDirection: 'row', gap: 5.67, alignItems: 'center', marginTop: -2 }}>
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', paddingLeft: 6 }}>
        <FriendPfp pfp_url={friends[0].pfp_url} />
        {friends[1] && <FriendPfp pfp_url={friends[1].pfp_url} />}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text color="labelSecondary" size="11pt" weight="bold" numberOfLines={1} style={{ maxWidth: 148 }}>
          {friends[0].username}{' '}
        </Text>
        {friends.length > 1 && (
          <Text color="labelTertiary" size="11pt" weight="bold">
            {i18n.t(t.and_others, { count: friends.length - 1 })}
          </Text>
        )}
      </View>
    </View>
  );
}

function TrendingTokenLoadingRow() {
  const backgroundColor = useBackgroundColor('surfacePrimary');
  const { isDarkMode } = useTheme();
  return (
    <View style={{ flex: 1, height: 78, width: '100%' }}>
      <Skeleton>
        <View style={{ paddingVertical: 12, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <FakeAvatar />

          <View style={{ gap: 12, flex: 1 }}>
            <View style={{ flexDirection: 'row', gap: 5.67, alignItems: 'center', marginTop: -2 }}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
                <View
                  style={{
                    height: 12 + 2,
                    width: 12 + 2,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: backgroundColor,
                    backgroundColor: isDarkMode ? darkModeThemeColors.skeleton : colors.skeleton,
                    marginVertical: -1,
                    marginLeft: -6,
                  }}
                />
                <View
                  style={{
                    height: 12 + 2,
                    width: 12 + 2,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: backgroundColor,
                    backgroundColor: isDarkMode ? darkModeThemeColors.skeleton : colors.skeleton,
                    marginVertical: -1,
                  }}
                />
              </View>

              <FakeText width={148} />
            </View>

            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', gap: 6, alignItems: 'baseline' }}>
                  <FakeText height={16} width={84} />
                  <FakeText height={14} width={32} />
                  <FakeText height={16} width={60} />
                </View>

                <View style={{ flexDirection: 'row', gap: 18, alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    <FakeText height={14} width={32} />
                    <FakeText height={14} width={44} />
                  </View>

                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    <FakeText height={14} width={36} />
                    <FakeText height={14} width={52} />
                  </View>
                </View>
              </View>

              <View style={{ gap: 8, marginLeft: 'auto' }}>
                <View style={{ flexDirection: 'row', gap: 2, alignItems: 'center' }}>
                  <FakeText height={16} width={60} />
                </View>
                <View style={{ flexDirection: 'row', gap: 5, justifyContent: 'flex-end' }}>
                  <FakeText width={40} />
                </View>
              </View>
            </View>
          </View>
        </View>
      </Skeleton>
    </View>
  );
}

function TrendingTokenRow({ token }: { token: TrendingToken }) {
  const separatorColor = useForegroundColor('separator');

  const price = formatCurrency(token.price);
  const marketCap = formatNumber(token.marketCap, { useOrderSuffix: true, decimals: 1, style: '$' });
  const volume = formatNumber(token.volume, { useOrderSuffix: true, decimals: 1, style: '$' });

  const handleNavigateToToken = useCallback(() => {
    analyticsV2.track(analyticsV2.event.viewTrendingToken, {
      address: token.address,
      chainId: token.chainId,
      symbol: token.symbol,
      name: token.name,
      highlightedFriends: token.highlightedFriends.length,
    });

    swapsStore.setState({
      lastNavigatedTrendingToken: token.uniqueId,
    });

    Navigation.handleAction(Routes.EXPANDED_ASSET_SHEET, {
      asset: token,
      type: 'token',
    });
  }, [token]);

  if (!token) return null;

  return (
    <ButtonPressAnimation onPress={handleNavigateToToken} scaleTo={0.94}>
      <View style={{ paddingVertical: 12, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <SwapCoinIcon
          iconUrl={token.icon_url}
          color={token.colors.primary}
          chainId={token.chainId}
          address={token.address}
          symbol={token.symbol}
          size={40}
          chainSize={20}
        />

        <View style={{ gap: 12, flex: 1 }}>
          <FriendHolders friends={token.highlightedFriends} />

          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'baseline' }}>
                <Text color="label" size="15pt" weight="bold" style={{ maxWidth: 100 }} numberOfLines={1}>
                  {token.name}
                </Text>
                <Text color="labelTertiary" size="11pt" weight="bold" style={{ maxWidth: 100 }} numberOfLines={1}>
                  {token.symbol}
                </Text>
                <Text color="label" size="15pt" weight="bold">
                  {price}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  <Text color="labelQuaternary" size="11pt" weight="bold">
                    VOL
                  </Text>
                  <Text color="labelTertiary" size="11pt" weight="bold">
                    {volume}
                  </Text>
                </View>

                <Text color={{ custom: separatorColor }} size="icon 9px" weight="bold">
                  |
                </Text>

                <View style={{ flexDirection: 'row', gap: 4 }}>
                  <Text color="labelQuaternary" size="11pt" weight="bold">
                    MCAP
                  </Text>
                  <Text color="labelTertiary" size="11pt" weight="bold">
                    {marketCap}
                  </Text>
                </View>
              </View>
            </View>

            <View style={{ gap: 12, marginLeft: 'auto' }}>
              <View style={{ flexDirection: 'row', gap: 2, alignItems: 'center' }}>
                <Text color={token.priceChange.timeframe > 0 ? 'green' : 'red'} size="11pt" weight="bold">
                  {token.priceChange.timeframe > 0 ? '􀄨' : '􀄩'}
                </Text>
                <Text color={token.priceChange.timeframe > 0 ? 'green' : 'red'} size="15pt" weight="bold">
                  {formatNumber(token.priceChange.timeframe, { decimals: 2, useOrderSuffix: true })}%
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 5, justifyContent: 'flex-end' }}>
                <Text color="labelQuaternary" size="11pt" weight="bold">
                  1H
                </Text>
                <Text color={token.priceChange.hr > 0 ? 'green' : 'red'} size="11pt" weight="bold">
                  {formatNumber(token.priceChange.hr, { decimals: 2, useOrderSuffix: true })}%
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </ButtonPressAnimation>
  );
}

function NoResults() {
  const { isDarkMode } = useTheme();
  const fillQuaternary = useBackgroundColor('fillQuaternary');
  const backgroundColor = isDarkMode ? '#191A1C' : fillQuaternary;

  return (
    <View style={{ flex: 1, padding: 20, flexDirection: 'row', justifyContent: 'space-between', backgroundColor, borderRadius: 20 }}>
      <View style={{ flex: 1, gap: 16 }}>
        <Text color="label" size="20pt" weight="heavy">
          {i18n.t(t.no_results.title)}
        </Text>
        <Text color="labelSecondary" size="15pt" weight="semibold">
          {i18n.t(t.no_results.body)}
        </Text>
      </View>
      <View style={{ backgroundColor: '#FF584D', height: 36, width: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}>
        <Text color={{ custom: 'white' }} size="13pt" style={{ textAlign: 'center', paddingLeft: 2, paddingTop: 1 }}>
          􀙭
        </Text>
      </View>
    </View>
  );
}

function NetworkFilter() {
  const [isOpen, setOpen] = useState(false);
  const selected = useSharedValue<ChainId | undefined>(undefined);
  const { chainId, setChainId } = useTrendingTokensStore(state => ({
    chainId: state.chainId,
    setChainId: state.setChainId,
  }));

  const setSelected = useCallback(
    (chainId: ChainId | undefined) => {
      'worklet';
      selected.value = chainId;
      runOnJS(setChainId)(chainId);
    },
    [selected, setChainId]
  );

  const label = useMemo(() => {
    if (!chainId) return i18n.t(t.all);
    return chainsLabel[chainId];
  }, [chainId]);

  const icon = useMemo(() => {
    if (!chainId) return '􀤆';
    return <ChainImage chainId={chainId} size={16} />;
  }, [chainId]);

  return (
    <>
      <FilterButton label={label} icon={icon} onPress={() => setOpen(true)} />
      {isOpen && <NetworkSelector selected={selected} setSelected={setSelected} onClose={() => setOpen(false)} />}
    </>
  );
}

function TimeFilter() {
  const timeframe = useTrendingTokensStore(state => state.timeframe);

  return (
    <DropdownMenu
      menuConfig={{
        menuItems: timeFilters.map(time => ({
          actionTitle: i18n.t(t.filters.time[time]),
          actionKey: time,
        })),
      }}
      side="bottom"
      onPressMenuItem={timeframe => useTrendingTokensStore.getState().setTimeframe(timeframe)}
    >
      <FilterButton label={i18n.t(t.filters.time[timeframe])} icon="􀐫" />
    </DropdownMenu>
  );
}

function SortFilter() {
  const sort = useTrendingTokensStore(state => state.sort);

  const iconColor = useForegroundColor('labelQuaternary');

  return (
    <DropdownMenu
      menuConfig={{
        menuItems: sortFilters
          .filter(s => s !== 'RECOMMENDED')
          .map(sort => ({
            actionTitle: i18n.t(t.filters.sort[sort]),
            actionKey: sort,
          })),
      }}
      side="bottom"
      onPressMenuItem={selection => {
        if (selection === sort) return useTrendingTokensStore.getState().setSort(TrendingSort.Recommended);
        useTrendingTokensStore.getState().setSort(selection);
      }}
    >
      <FilterButton
        label={i18n.t(t.filters.sort[sort])}
        icon={
          <Text color={{ custom: iconColor }} size="icon 13px" weight="heavy" style={{ width: 20 }}>
            􀄬
          </Text>
        }
      />
    </DropdownMenu>
  );
}

function TrendingTokenData() {
  const { data: trendingTokens, isLoading } = useTrendingTokensData();
  if (isLoading)
    return (
      <View style={{ flex: 1 }}>
        {Array.from({ length: 10 }).map((_, index) => (
          <TrendingTokenLoadingRow key={index} />
        ))}
      </View>
    );

  return (
    <FlatList
      style={{ marginHorizontal: -20 }}
      contentContainerStyle={{ paddingHorizontal: 20 }}
      ListEmptyComponent={<NoResults />}
      data={trendingTokens}
      renderItem={({ item }) => <TrendingTokenRow token={item} />}
    />
  );
}

export function TrendingTokens() {
  const padding = 20;
  return (
    <View style={{ gap: 28 }}>
      <View style={{ gap: 12, justifyContent: 'center' }}>
        <Animated.ScrollView
          showsHorizontalScrollIndicator={false}
          horizontal
          contentContainerStyle={{ alignItems: 'center', flexDirection: 'row', gap: 12, paddingHorizontal: padding }}
          style={{ marginHorizontal: -padding }}
        >
          <CategoryFilterButton
            category={TrendingCategory.Trending}
            label={i18n.t(t.filters.categories.TRENDING)}
            icon="􀙭"
            iconColor={'#D0281C'}
            highlightedBackgroundColor={'#E6A39E'}
          />
          <CategoryFilterButton
            category={TrendingCategory.New}
            label={i18n.t(t.filters.categories.NEW)}
            icon="􀋃"
            iconColor={'#FFDA24'}
            highlightedBackgroundColor={'#F9EAA1'}
            iconWidth={18}
          />
          <CategoryFilterButton
            category={TrendingCategory.Farcaster}
            label={i18n.t(t.filters.categories.FARCASTER)}
            icon="􀌥"
            iconColor={'#5F5AFA'}
            highlightedBackgroundColor={'#B9B7F7'}
            iconWidth={20}
          />
        </Animated.ScrollView>

        <Animated.ScrollView
          showsHorizontalScrollIndicator={false}
          horizontal
          contentContainerStyle={{ alignItems: 'center', flexDirection: 'row', gap: 12, paddingHorizontal: padding }}
          style={{ marginHorizontal: -padding }}
        >
          <NetworkFilter />
          <TimeFilter />
          <SortFilter />
        </Animated.ScrollView>
      </View>

      <TrendingTokenData />
      <ReportAnalytics />
    </View>
  );
}
