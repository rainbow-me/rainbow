import { LegendList } from '@legendapp/list';
import React, { memo, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Panel } from '@/components/SmoothPager/ListPanel';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { SheetHandleFixedToTop } from '@/components/sheet';
import { Box, Column, Columns, Inline, Separator, Text, TextIcon, globalColors, useColorMode, useForegroundColor } from '@/design-system';
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
  asset: Asset;
  chainId: ChainId;
  icon: string;
  name: string;
  symbol: string;
  uniqueId: string;
  value: string | number;
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
          <Box width={DEVICE_WIDTH - 28 * 2}>
            <Separator color={{ custom: opacity(separator, 0.025) }} thickness={1} />
          </Box>
        </Box>
        <AirdropsList />
      </Panel>
    </View>
  );
};

const AirdropsList = () => {
  const airdrops = useAirdropsStore(state => state.getData()?.claimables);
  return airdrops ? (
    <LegendList<Claimable>
      contentContainerStyle={styles.scrollContent}
      data={airdrops}
      drawDistance={PANEL_HEIGHT * 1.25}
      estimatedItemSize={COIN_ROW_HEIGHT + COIN_ROW_GAP}
      keyExtractor={keyExtractor}
      keyboardShouldPersistTaps="always"
      maintainVisibleContentPosition
      recycleItems
      renderItem={renderAirdropCoinRow}
      scrollIndicatorInsets={SCROLL_INDICATOR_INSETS}
      style={styles.scrollView}
    />
  ) : null;
};

const AirdropCoinRow = memo(
  function AirdropCoinRow({ address, asset, chainId, icon, name, symbol, value }: AirdropClaimable) {
    const { isDarkMode } = useColorMode();
    const { navigate } = useNavigation();

    const handlePress = useCallback(async () => {
      navigate(Routes.EXPANDED_ASSET_SHEET_V2, { address: address, asset, chainId: chainId, loadExternalAsset: false });
    }, [navigate, address, asset, chainId]);

    return (
      <Box width="full">
        <ButtonPressAnimation onPress={handlePress} scaleTo={0.95} style={styles.buttonPressWrapper}>
          <Columns alignHorizontal="justify" alignVertical="center" space="12px">
            <Column width="content">
              <RainbowCoinIcon chainId={chainId} chainSize={16} icon={icon} symbol={symbol} />
            </Column>

            <Column>
              <Box gap={10}>
                <Inline alignVertical="center" horizontalSpace={{ custom: 1 }}>
                  <TextIcon align="left" color="label" height={IS_IOS ? undefined : 9.5} size="icon 14px" weight="semibold" width={12}>
                    􁎢
                  </TextIcon>
                  <Text color="label" numberOfLines={1} size="17pt" weight="semibold">
                    {symbol}
                  </Text>
                </Inline>
                <Text color="labelTertiary" numberOfLines={1} size="13pt" weight="semibold">
                  {name}
                </Text>
              </Box>
            </Column>

            <Column width="content">
              <Box flexDirection="row" justifyContent="flex-end" gap={8}>
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
                    {`${value}`}
                  </Text>
                </Box>
                <ButtonPressAnimation onPress={handlePress}>
                  <Box
                    alignItems="center"
                    backgroundColor={isDarkMode ? opacity(globalColors.white100, 0.8) : globalColors.grey100}
                    borderColor={isDarkMode ? { custom: globalColors.white100 } : undefined}
                    borderRadius={12}
                    borderWidth={THICK_BORDER_WIDTH}
                    flexDirection="row"
                    gap={3}
                    height={28}
                    paddingHorizontal="8px"
                  >
                    <TextIcon
                      color={{ custom: isDarkMode ? globalColors.grey100 : globalColors.white100 }}
                      height={IS_IOS ? undefined : 7.5}
                      size="icon 13px"
                      weight="heavy"
                    >
                      􀎽
                    </TextIcon>
                    <Text
                      align="center"
                      color={{ custom: isDarkMode ? globalColors.grey100 : globalColors.white100 }}
                      numberOfLines={1}
                      size="17pt"
                      weight="bold"
                    >
                      Claim
                    </Text>
                  </Box>
                </ButtonPressAnimation>
              </Box>
            </Column>
          </Columns>
        </ButtonPressAnimation>
      </Box>
    );
  },
  (prev, next) => prev.uniqueId === next.uniqueId && prev.value === next.value
);

function keyExtractor(item: Claimable): string {
  return item.uniqueId;
}

function renderAirdropCoinRow({ item: claimable }: { index: number; item: Claimable }) {
  return (
    <AirdropCoinRow
      address={claimable.asset.address}
      asset={claimable.asset}
      chainId={claimable.chainId}
      icon={claimable.asset.icon_url ?? claimable.iconUrl}
      key={claimable.uniqueId}
      name={claimable.name}
      symbol={claimable.asset.symbol}
      uniqueId={claimable.uniqueId}
      value={claimable.value.nativeAsset.display}
    />
  );
}

const styles = StyleSheet.create({
  buttonPressWrapper: {
    alignItems: 'center',
    height: COIN_ROW_HEIGHT + COIN_ROW_GAP,
    justifyContent: 'center',
    width: '100%',
  },
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: safeAreaInsetValues.bottom,
    width: '100%',
  },
  scrollContent: {
    paddingBottom: 44,
    paddingHorizontal: 24,
    paddingTop: 10,
    width: '100%',
  },
  scrollView: {
    flex: 1,
  },
});
