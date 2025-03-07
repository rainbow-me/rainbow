import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { LegendList } from '@legendapp/list';
import React, { memo, useCallback } from 'react';
import { View, StyleSheet, ScrollViewProps } from 'react-native';
import { PANEL_COLOR_DARK, Panel } from '@/components/SmoothPager/ListPanel';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { SheetHandleFixedToTop } from '@/components/sheet';
import { Box, IconContainer, Separator, Stack, Text, TextIcon, globalColors, useColorMode, useForegroundColor } from '@/design-system';
import { getColorForTheme } from '@/design-system/color/useForegroundColor';
import { Asset } from '@/entities/tokens';
import { IS_IOS } from '@/env';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { Claimable } from '@/resources/addys/claimables/types';
import { ChainId } from '@/state/backendNetworks/types';
import { useAirdropsStore } from '@/state/claimables/airdropsStore';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacity } from '@/__swaps__/utils/swaps';
import { safeAreaInsetValues } from '@/utils';
import { DEVICE_HEIGHT, DEVICE_WIDTH } from '@/utils/deviceUtils';

interface AirdropClaimable {
  address: string;
  airdropValue: string;
  asset: Asset;
  chainId: ChainId;
  handlePress: (address: string, asset: Asset, chainId: ChainId) => void;
  icon: string;
  isDarkMode: boolean;
  name: string;
  symbol: string;
  uniqueId: string;
}

const COIN_ROW_HEIGHT = 40;
const COIN_ROW_GAP = 28;
const PANEL_HEIGHT = DEVICE_HEIGHT - safeAreaInsetValues.top - safeAreaInsetValues.bottom;
const SCROLL_INDICATOR_INSETS = { bottom: 44, top: 4 };

export const AirdropsSheet = () => {
  const separator = useForegroundColor('separator');
  return (
    <View style={styles.container}>
      <Panel height={PANEL_HEIGHT}>
        <Box alignItems="center" gap={24} justifyContent="center" paddingTop="32px" width="full">
          <SheetHandleFixedToTop />
          <Text align="center" color="label" containsEmoji size="20pt" weight="heavy">
            Claim Rainbow Coins
          </Text>
          <Box width={DEVICE_WIDTH - 26 * 2}>
            <Separator color={{ custom: opacity(separator, 0.025) }} thickness={1} />
          </Box>
        </Box>
        <AirdropsList />
      </Panel>
    </View>
  );
};

const AirdropsList = () => {
  const { isDarkMode } = useColorMode();
  const { navigate } = useNavigation();

  const airdrops = useAirdropsStore(state => state.getData()?.claimables);

  const handlePress = useCallback(
    (address: string, asset: Asset, chainId: ChainId) => {
      navigate(Routes.EXPANDED_ASSET_SHEET_V2, { address, asset, chainId });
    },
    [navigate]
  );

  const renderItem = useCallback(
    ({ item }: { item: Claimable }) => {
      return (
        <AirdropCoinRow
          address={item.asset.address}
          airdropValue={item.value.nativeAsset.display}
          asset={item.asset}
          chainId={item.chainId}
          handlePress={() => handlePress(item.asset.address, item.asset, item.chainId)}
          icon={item.asset.icon_url ?? item.iconUrl}
          isDarkMode={isDarkMode}
          name={item.name}
          symbol={item.asset.symbol}
          uniqueId={item.uniqueId}
        />
      );
    },
    [handlePress, isDarkMode]
  );

  return airdrops?.length ? (
    <LegendList
      contentContainerStyle={styles.scrollContent}
      data={airdrops}
      drawDistance={PANEL_HEIGHT}
      estimatedItemSize={COIN_ROW_HEIGHT + COIN_ROW_GAP}
      keyExtractor={keyExtractor}
      keyboardShouldPersistTaps="always"
      maintainVisibleContentPosition
      recycleItems
      removeClippedSubviews
      renderItem={renderItem}
      renderScrollComponent={IS_IOS ? undefined : AndroidScrollView}
      scrollIndicatorInsets={SCROLL_INDICATOR_INSETS}
      style={styles.scrollView}
    />
  ) : (
    <EmptyState />
  );
};

const AndroidScrollView = ({ children, ...props }: ScrollViewProps) => {
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <BottomSheetScrollView {...props}>{children}</BottomSheetScrollView>;
};

const DARK_PANEL_COLOR = { custom: PANEL_COLOR_DARK };
const EMPTY_STATE_TEXT_COLORS = {
  dark: { custom: opacity(getColorForTheme('labelQuaternary', 'dark'), 0.2) },
  light: { custom: opacity(getColorForTheme('labelQuaternary', 'light'), 0.2) },
};

const EmptyState = () => {
  const { isDarkMode } = useColorMode();
  return (
    <View style={styles.emptyStateContainer}>
      <Stack alignHorizontal="center" space="20px">
        <IconContainer
          background={isDarkMode ? 'fillSecondary' : 'fill'}
          borderColor={isDarkMode ? 'separatorTertiary' : undefined}
          borderRadius={38}
          borderWidth={isDarkMode ? THICK_BORDER_WIDTH * 2 : undefined}
          height={76}
          width={76}
        >
          <Text align="center" color={isDarkMode ? DARK_PANEL_COLOR : WHITE_TEXT_COLOR} size="44pt" weight="heavy">
            􁎢
          </Text>
        </IconContainer>
        <Text align="center" color={EMPTY_STATE_TEXT_COLORS[isDarkMode ? 'dark' : 'light']} size="22pt" weight="heavy">
          No airdrops yet…
        </Text>
      </Stack>
    </View>
  );
};

const BLACK_TEXT_COLOR = { custom: globalColors.grey100 };
const WHITE_TEXT_COLOR = { custom: globalColors.white100 };
const WHITE_80 = 'rgba(255, 255, 255, 0.8)';

const AirdropCoinRow = memo(
  function AirdropCoinRow({ airdropValue, chainId, handlePress, icon, isDarkMode, name, symbol }: AirdropClaimable) {
    return (
      <ButtonPressAnimation onPress={handlePress} scaleTo={0.95} style={styles.rowContainer}>
        <RainbowCoinIcon chainId={chainId} chainSize={16} icon={icon} size={40} symbol={symbol} />

        <View style={styles.textContainer}>
          <Text color="label" numberOfLines={1} size="17pt" weight="semibold">
            {symbol}
          </Text>
          <Text color="labelQuaternary" numberOfLines={1} size="13pt" weight="bold">
            {name}
          </Text>
        </View>

        <View style={styles.rowEnd}>
          <Box
            alignItems="center"
            background="fillQuaternary"
            borderColor="separatorSecondary"
            borderRadius={12}
            borderWidth={THICK_BORDER_WIDTH}
            height={28}
            justifyContent="center"
            paddingHorizontal="8px"
          >
            <Text align="center" color="label" numberOfLines={1} size="17pt" weight="semibold">
              {airdropValue}
            </Text>
          </Box>

          <ButtonPressAnimation>
            <View style={isDarkMode ? styles.claimButtonDark : styles.claimButtonLight}>
              <TextIcon
                color={isDarkMode ? BLACK_TEXT_COLOR : WHITE_TEXT_COLOR}
                height={IS_IOS ? undefined : 7.5}
                size="icon 13px"
                weight="heavy"
              >
                􀎽
              </TextIcon>
              <Text align="center" color={isDarkMode ? BLACK_TEXT_COLOR : WHITE_TEXT_COLOR} numberOfLines={1} size="17pt" weight="bold">
                Claim
              </Text>
            </View>
          </ButtonPressAnimation>
        </View>
      </ButtonPressAnimation>
    );
  },
  (prev, next) => prev.uniqueId === next.uniqueId && prev.airdropValue === next.airdropValue
);

function keyExtractor(item: Claimable): string {
  return item.uniqueId;
}

const baseStyles = StyleSheet.create({
  claimButton: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 3,
    height: 28,
    overflow: 'hidden',
    paddingHorizontal: 8,
  },
});

const styles = StyleSheet.create({
  buttonPressWrapper: {
    alignItems: 'center',
    flexDirection: 'row',
    height: COIN_ROW_HEIGHT + COIN_ROW_GAP,
    justifyContent: 'center',
    width: '100%',
  },
  claimButtonDark: {
    ...baseStyles.claimButton,
    backgroundColor: WHITE_80,
    borderColor: WHITE_TEXT_COLOR.custom,
    borderWidth: THICK_BORDER_WIDTH,
    paddingHorizontal: 8 - THICK_BORDER_WIDTH,
  },
  claimButtonLight: {
    ...baseStyles.claimButton,
    backgroundColor: globalColors.grey100,
  },
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: safeAreaInsetValues.bottom,
    width: '100%',
  },
  emptyStateContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 96,
  },
  fullWidth: {
    width: '100%',
  },
  rowContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    height: COIN_ROW_HEIGHT + COIN_ROW_GAP,
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
    width: '100%',
  },
  rowEnd: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
    width: 'auto',
  },
  scrollContent: {
    paddingBottom: 44,
    paddingTop: 10,
    width: '100%',
  },
  scrollView: {
    flex: 1,
  },
  textContainer: {
    flex: 1,
    gap: 11,
  },
});
