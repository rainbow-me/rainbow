import { DropdownMenu } from '@/components/DropdownMenu';
import { globalColors, Text, TextIcon, useBackgroundColor, useColorMode } from '@/design-system';
import { useForegroundColor } from '@/design-system/color/useForegroundColor';

import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { analyticsV2 } from '@/analytics';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { ChainId } from '@/state/backendNetworks/types';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import Skeleton, { FakeAvatar, FakeText } from '@/components/skeleton/Skeleton';
import { SortDirection, Timeframe, TrendingCategory, TrendingSort } from '@/graphql/__generated__/arc';
import { formatCurrency, formatNumber } from '@/helpers/strings';
import * as i18n from '@/languages';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { FarcasterUser, TrendingToken, useTrendingTokens } from '@/resources/trendingTokens/trendingTokens';
import { useNavigationStore } from '@/state/navigation/navigationStore';
import { swapsStore } from '@/state/swaps/swapsStore';
import { sortFilters, timeFilters, useTrendingTokensStore } from '@/state/trendingTokens/trendingTokens';
import { useCallback, useEffect, useMemo } from 'react';
import React, { FlatList, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { runOnJS, useSharedValue } from 'react-native-reanimated';
import { ButtonPressAnimation } from '../animations';
import { useFarcasterAccountForWallets } from '@/hooks/useFarcasterAccountForWallets';
import { ImgixImage } from '../images';
import { useRemoteConfig } from '@/model/remoteConfig';
import { useAccountSettings } from '@/hooks';
import { getColorWorklet, getMixedColor, opacity } from '@/__swaps__/utils/swaps';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { IS_IOS } from '@/env';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';

const t = i18n.l.trending_tokens;

function FilterButton({
  icon,
  label,
  onPress,
  selected,
  iconColor,
  highlightedBackgroundColor,
}: {
  onPress?: VoidFunction;
  label: string;
  icon: string | JSX.Element;
  selected: boolean;
  iconColor?: string;
  highlightedBackgroundColor?: string;
}) {
  const { isDarkMode } = useColorMode();
  const fillTertiary = useBackgroundColor('fillTertiary');
  const separatorSecondary = useForegroundColor('separatorSecondary');
  const borderColor = selected && isDarkMode ? globalColors.white80 : separatorSecondary;
  const defaultIconColor = getColorWorklet('labelSecondary', selected ? false : isDarkMode);

  const gradientColors = useMemo(() => {
    if (!selected) return [fillTertiary, fillTertiary];
    return highlightedBackgroundColor
      ? [highlightedBackgroundColor, globalColors.white100]
      : [
          isDarkMode ? opacity(globalColors.white100, 0.72) : opacity(fillTertiary, 0.2),
          isDarkMode ? opacity(globalColors.white100, 0.92) : opacity(fillTertiary, 0),
        ];
  }, [fillTertiary, highlightedBackgroundColor, selected, isDarkMode]);

  return (
    <ButtonPressAnimation scaleTo={0.92} onPress={onPress}>
      <LinearGradient
        colors={gradientColors}
        end={{ x: 0.5, y: 1 }}
        start={{ x: 0.5, y: 0 }}
        style={{
          alignItems: 'center',
          borderColor,
          borderRadius: 18,
          borderWidth: THICK_BORDER_WIDTH,
          flexDirection: 'row',
          gap: 4,
          height: 36,
          paddingHorizontal: 12 - THICK_BORDER_WIDTH,
        }}
      >
        {typeof icon === 'string' ? (
          <TextIcon
            color={{ custom: iconColor || defaultIconColor }}
            size="icon 13px"
            textStyle={IS_IOS ? undefined : { marginTop: -2 }}
            weight="heavy"
            width={16}
          >
            {icon}
          </TextIcon>
        ) : (
          icon
        )}
        <View>
          {/* This first Text element sets the width of the container */}
          <Text align="center" color="label" size="17pt" weight="heavy" style={{ opacity: 0 }}>
            {label}
          </Text>
          {/* This second Text element is the visible label, positioned absolutely within the established frame */}
          <Text
            align="center"
            color={selected ? { custom: globalColors.grey100 } : 'labelSecondary'}
            size="17pt"
            style={{ bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }}
            weight={selected ? 'heavy' : 'bold'}
          >
            {label}
          </Text>
        </View>
        <Text color={{ custom: iconColor || defaultIconColor }} size="13pt" weight="bold" style={{ width: 14 }}>
          􀆏
        </Text>
      </LinearGradient>
    </ButtonPressAnimation>
  );
}

function useTrendingTokensData() {
  const { nativeCurrency } = useAccountSettings();
  const remoteConfig = useRemoteConfig();
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
    sortDirection: SortDirection.Desc,
    limit: remoteConfig.trending_tokens_limit,
    walletAddress: walletAddress,
    currency: nativeCurrency,
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
  iconColor: string | { default: string; selected: string };
  highlightedBackgroundColor: string;
  iconWidth?: number;
  label: string;
}) {
  const { isDarkMode } = useColorMode();
  const fillTertiary = useBackgroundColor('fillTertiary');
  const separatorSecondary = useForegroundColor('separatorSecondary');

  const selected = useTrendingTokensStore(state => state.category === category);

  const borderColor = selected && isDarkMode ? globalColors.white80 : separatorSecondary;

  const gradientColors = useMemo(() => {
    if (!selected) return [fillTertiary, fillTertiary];
    return [highlightedBackgroundColor, globalColors.white100];
  }, [fillTertiary, highlightedBackgroundColor, selected]);

  const selectCategory = useCallback(() => {
    useTrendingTokensStore.getState().setCategory(category);
  }, [category]);

  return (
    <ButtonPressAnimation scaleTo={0.92} onPress={selectCategory}>
      <LinearGradient
        colors={gradientColors}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          height: 36,
          paddingHorizontal: 12,
          borderRadius: 18,
          borderWidth: THICK_BORDER_WIDTH,
          borderColor,
        }}
      >
        <TextIcon
          color={{ custom: typeof iconColor === 'string' ? iconColor : selected ? iconColor.selected : iconColor.default }}
          size="icon 13px"
          textStyle={{ marginTop: IS_IOS ? -3.5 : -2 }}
          weight="heavy"
          width={iconWidth}
        >
          {icon}
        </TextIcon>
        <View>
          {/* This first Text element sets the width of the container */}
          <Text align="center" color="label" size="17pt" weight="heavy" style={{ opacity: 0 }}>
            {label}
          </Text>
          {/* This second Text element is the visible label, positioned absolutely within the established frame */}
          <Text
            align="center"
            color={selected ? { custom: globalColors.grey100 } : 'labelSecondary'}
            size="17pt"
            style={{ bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }}
            weight={selected ? 'heavy' : 'bold'}
          >
            {label}
          </Text>
        </View>
      </LinearGradient>
    </ButtonPressAnimation>
  );
}

function FriendPfp({ pfp_url }: { pfp_url: string }) {
  const backgroundColor = useBackgroundColor('surfacePrimary');
  return (
    <ImgixImage
      enableFasterImage
      source={{ uri: pfp_url }}
      style={{
        height: 12 + 2,
        width: 12 + 2,
        borderRadius: 7,
        borderWidth: 1,
        borderColor: backgroundColor,
        marginVertical: -1,
        marginLeft: -4,
      }}
    />
  );
}
function FriendHolders({ friends }: { friends: FarcasterUser[] }) {
  if (friends.length === 0) return null;
  const howManyOthers = Math.max(1, friends.length - 2);
  const separator = howManyOthers === 1 && friends.length === 2 ? ` ${i18n.t(t.and)} ` : ', ';

  return (
    <View style={{ alignItems: 'center', flexDirection: 'row', flexWrap: 'nowrap', gap: 5.67, height: 7 }}>
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', height: 7, paddingLeft: 4 }}>
        <FriendPfp pfp_url={friends[0].pfp_url} />
        {friends[1] && <FriendPfp pfp_url={friends[1].pfp_url} />}
      </View>

      <View style={{ alignItems: 'center', flexDirection: 'row', marginTop: -0.5 }}>
        <Text color="labelTertiary" size="11pt" weight="bold" numberOfLines={1}>
          {friends[0].username}
          {friends[1] && (
            <>
              <Text color="labelQuaternary" size="11pt" weight="bold">
                {separator}
              </Text>
              {friends[1].username}
            </>
          )}
        </Text>
        {friends.length > 2 && (
          <Text color="labelQuaternary" size="11pt" weight="bold">
            {' '}
            {i18n.t(t.and_others[howManyOthers === 1 ? 'one' : 'other'], { count: howManyOthers })}
          </Text>
        )}
      </View>
    </View>
  );
}

function TrendingTokenLoadingRow() {
  return (
    <View style={{ flex: 1, height: 48, width: '100%' }}>
      <Skeleton style={{ alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: 12, height: 48, justifyContent: 'center' }}>
          <FakeAvatar />

          <View style={{ flex: 1, flexDirection: 'column', gap: 12 }}>
            <FakeText height={7} width={100} />
            <FakeText height={10} width={136} />
            <FakeText height={7} width={104} />
          </View>

          <View style={{ alignItems: 'flex-end', flex: 1, flexDirection: 'column', gap: 12, height: '100%', justifyContent: 'flex-end' }}>
            <FakeText height={10} width={72} />
            <FakeText height={7} width={60} />
          </View>
        </View>
      </Skeleton>
    </View>
  );
}

function getPriceChangeColor(priceChange: number) {
  if (priceChange === 0) return 'labelTertiary';
  return priceChange > 0 ? 'green' : 'red';
}

const TOKEN_LIST_INSET = 20 * 2;
const TOKEN_ICON_WIDTH = 40 + 12;
const TOKEN_PRICE_CHANGE_WIDTH = 75;

const TOKEN_DETAILS_WIDTH = DEVICE_WIDTH - TOKEN_LIST_INSET - TOKEN_ICON_WIDTH - TOKEN_PRICE_CHANGE_WIDTH;

function getTextWidths(symbol: string, price: string) {
  const minPriceWidth = price.length * 9 + 8; // 9px per character + some padding

  const remainingWidth = TOKEN_DETAILS_WIDTH - minPriceWidth - 12; // 12 for gaps

  const maxSymbolWidth = Math.min(symbol.length * 8 + 16, remainingWidth * 0.3);

  const nameWidth = remainingWidth - maxSymbolWidth;

  return {
    nameWidth,
    symbolWidth: maxSymbolWidth,
    minPriceWidth,
  };
}

function TrendingTokenRow({ token }: { token: TrendingToken }) {
  const separatorSecondary = useForegroundColor('separatorSecondary');

  const price = formatCurrency(token.price);
  const { nameWidth, symbolWidth, minPriceWidth } = getTextWidths(token.symbol, price);
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
      <View
        style={{
          overflow: 'visible',
          flexDirection: 'row',
          gap: 12,
          height: token.highlightedFriends.length > 0 ? 48 : 40,
          alignItems: 'center',
        }}
      >
        <RainbowCoinIcon icon={token.icon_url} color={token.colors.primary} chainId={token.chainId} symbol={token.symbol} />

        <View style={{ gap: 12, flex: 1 }}>
          <FriendHolders friends={token.highlightedFriends} />

          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <View style={{ gap: 12 }}>
              <View
                style={{
                  alignItems: IS_IOS ? 'baseline' : 'flex-end',
                  flexDirection: 'row',
                  gap: 6,
                  height: 12,
                  width: TOKEN_DETAILS_WIDTH,
                }}
              >
                <Text
                  color="label"
                  numberOfLines={1}
                  size="15pt"
                  style={{
                    maxWidth: nameWidth,
                  }}
                  weight="bold"
                >
                  {token.name}
                </Text>
                <Text
                  color="labelTertiary"
                  numberOfLines={1}
                  ellipsizeMode="middle"
                  size="11pt"
                  style={{
                    bottom: IS_IOS ? 0 : -0.2,
                    maxWidth: symbolWidth,
                  }}
                  weight="bold"
                >
                  {token.symbol}
                </Text>
                <Text
                  color="label"
                  numberOfLines={1}
                  size="15pt"
                  style={{
                    minWidth: minPriceWidth,
                    flex: 1,
                  }}
                  weight="bold"
                >
                  {price}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 8, height: 7, alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  <Text color="labelQuaternary" size="11pt" weight="bold">
                    VOL
                  </Text>
                  <Text color="labelTertiary" numberOfLines={1} size="11pt" weight="bold">
                    {volume}
                  </Text>
                </View>

                <View style={{ backgroundColor: separatorSecondary, borderRadius: 1, height: 7, marginTop: 1, width: 1 }} />

                <View style={{ flexDirection: 'row', gap: 4 }}>
                  <Text color="labelQuaternary" size="11pt" weight="bold">
                    MCAP
                  </Text>
                  <Text color="labelTertiary" numberOfLines={1} size="11pt" weight="bold">
                    {marketCap}
                  </Text>
                </View>
              </View>
            </View>

            <View style={{ gap: 12, marginLeft: 'auto', maxWidth: 75 }}>
              <View style={{ flexDirection: 'row', gap: 2, alignItems: 'center', justifyContent: 'flex-end' }}>
                <Text color={getPriceChangeColor(token.priceChange.day)} size="15pt" weight="bold">
                  {formatNumber(token.priceChange.day, { decimals: 2, useOrderSuffix: true })}%
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 5, justifyContent: 'flex-end' }}>
                <Text color="labelQuaternary" size="11pt" weight="bold">
                  1H
                </Text>
                <Text color={getPriceChangeColor(token.priceChange.hr)} size="11pt" weight="bold">
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
  const { isDarkMode } = useColorMode();
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
  const chainId = useTrendingTokensStore(state => state.chainId);
  const selected = useSharedValue<ChainId | undefined>(chainId);

  const chainColor = useBackendNetworksStore(state => state.getColorsForChainId(chainId || ChainId.mainnet, false));
  const setChainId = useTrendingTokensStore(state => state.setChainId);

  const { icon, label, lightenedNetworkColor } = useMemo(() => {
    if (!chainId) return { icon: '􀤆', label: i18n.t(t.all), lightenedNetworkColor: undefined };
    return {
      icon: (
        <View style={{ marginRight: 2 }}>
          <ChainImage chainId={chainId} size={16} position="relative" />
        </View>
      ),
      label: useBackendNetworksStore.getState().getChainsLabel()[chainId],
      lightenedNetworkColor: chainColor ? getMixedColor(chainColor, globalColors.white100, 0.6) : undefined,
    };
  }, [chainColor, chainId]);

  const setSelected = useCallback(
    (chainId: ChainId | undefined) => {
      'worklet';
      selected.value = chainId;
      runOnJS(setChainId)(chainId);
    },
    [selected, setChainId]
  );

  const navigateToNetworkSelector = useCallback(() => {
    Navigation.handleAction(Routes.NETWORK_SELECTOR, {
      selected,
      setSelected,
    });
  }, [selected, setSelected]);

  return (
    <FilterButton
      selected={!!chainId}
      highlightedBackgroundColor={lightenedNetworkColor}
      label={label}
      icon={icon}
      onPress={navigateToNetworkSelector}
    />
  );
}

function TimeFilter() {
  const timeframe = useTrendingTokensStore(state => state.timeframe);
  const shouldAbbreviate = timeframe === Timeframe.H12 || timeframe === Timeframe.H24;

  return (
    <DropdownMenu
      menuConfig={{
        menuItems: timeFilters.map(time => ({
          actionTitle: i18n.t(t.filters.time[time]),
          menuState: time === timeframe ? 'on' : 'off',
          actionKey: time,
        })),
      }}
      menuItemType="checkbox"
      side="bottom"
      onPressMenuItem={timeframe => useTrendingTokensStore.getState().setTimeframe(timeframe)}
    >
      <FilterButton
        selected={timeframe !== Timeframe.D3}
        highlightedBackgroundColor={undefined}
        label={shouldAbbreviate ? i18n.t(t.filters.time[`${timeframe}_ABBREVIATED`]) : i18n.t(t.filters.time[timeframe])}
        icon="􀐫"
      />
    </DropdownMenu>
  );
}

function SortFilter() {
  const { isDarkMode } = useColorMode();
  const sort = useTrendingTokensStore(state => state.sort);
  const selected = sort !== TrendingSort.Recommended;

  const iconColor = getColorWorklet(selected ? 'labelSecondary' : 'labelTertiary', selected ? false : isDarkMode);

  const sortLabel = useMemo(() => {
    if (sort === TrendingSort.Recommended) return i18n.t(t.filters.sort.RECOMMENDED.label);
    return i18n.t(t.filters.sort[sort]);
  }, [sort]);

  return (
    <DropdownMenu
      menuConfig={{
        menuItems: sortFilters.map(s => ({
          actionTitle: s === TrendingSort.Recommended ? i18n.t(t.filters.sort.RECOMMENDED.menuOption) : i18n.t(t.filters.sort[s]),
          menuState: s === sort ? 'on' : 'off',
          actionKey: s,
        })),
      }}
      menuItemType="checkbox"
      side="bottom"
      onPressMenuItem={selection => {
        if (selection === sort) return useTrendingTokensStore.getState().setSort(TrendingSort.Recommended);
        useTrendingTokensStore.getState().setSort(selection);
      }}
    >
      <FilterButton
        selected={selected}
        iconColor={undefined}
        highlightedBackgroundColor={undefined}
        label={sortLabel}
        icon={
          <TextIcon
            color={{ custom: iconColor }}
            size="icon 13px"
            textStyle={IS_IOS ? undefined : { marginTop: -2 }}
            weight="heavy"
            width={20}
          >
            􀄬
          </TextIcon>
        }
      />
    </DropdownMenu>
  );
}

function TrendingTokensLoader() {
  const { trending_tokens_limit } = useRemoteConfig();

  return (
    <View style={{ flex: 1, gap: 28 }}>
      {Array.from({ length: trending_tokens_limit }).map((_, index) => (
        <TrendingTokenLoadingRow key={index} />
      ))}
    </View>
  );
}

function TrendingTokenData() {
  const { data: trendingTokens, isLoading } = useTrendingTokensData();
  if (isLoading) return <TrendingTokensLoader />;

  return (
    <FlatList
      style={{ marginHorizontal: -20, marginVertical: -12, paddingBottom: 8 }}
      contentContainerStyle={{ gap: 28, paddingHorizontal: 20, paddingVertical: 12 }}
      ListEmptyComponent={<NoResults />}
      data={trendingTokens}
      renderItem={({ item }) => <TrendingTokenRow token={item} />}
    />
  );
}

const padding = 20;

export function TrendingTokens() {
  const { isDarkMode } = useColorMode();
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
            iconColor={{ default: isDarkMode ? globalColors.yellow60 : '#FFBB00', selected: '#F5A200' }}
            highlightedBackgroundColor={'#FFEAC2'}
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
