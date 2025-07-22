import React, { useCallback, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { CoinIconIndicator } from '@/components/coin-icon';
import { Icon } from '@/components/icons';
import { ButtonPressAnimation } from '@/components/animations';
import { ExtendedState } from '../core/RawRecyclerList';
import { Text } from '@/design-system';
import { useAccountAsset, useCoinListFinishEditingOptions } from '@/hooks';
import Routes from '@/navigation/routesNames';
import { borders, colors, padding, shadow } from '@/styles';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { NativeCurrencyKey } from '@/entities';
import { ChainId } from '@/state/backendNetworks/types';
import { Navigation } from '@/navigation';
import { LiveTokenText } from '@/components/live-token-text/LiveTokenText';
import { toSignificantDigits } from '@/helpers/utilities';
import { getBalance, TokenData } from '@/state/liveTokens/liveTokensStore';

interface CoinCheckButtonProps {
  isHidden: boolean;
  isPinned: boolean;
  onPress: () => void;
  uniqueId: string;
  theme: any;
}

const CoinCheckButton = React.memo(function CoinCheckButton({ isHidden, isPinned, onPress, uniqueId, theme }: CoinCheckButtonProps) {
  const { selectedItems } = useCoinListFinishEditingOptions();
  const selected = selectedItems.includes(uniqueId);

  const showOutline = !(isHidden || isPinned);
  const coinIconPlaceholder = !selected && (isHidden || isPinned);

  const checkmarkBackgroundDynamicStyle = {
    ...shadow.buildAsObject(0, 4, 12, theme.isDarkMode ? colors.shadow : colors.appleBlue, 0.4),
  };

  return (
    <View style={sx.checkboxContainer}>
      <ButtonPressAnimation onPress={onPress}>
        <View style={sx.checkboxInnerContainer}>
          {showOutline && <View style={[sx.circleOutline, { borderColor: colors.alpha(colors.blueGreyDark, 0.12) }]} />}

          {coinIconPlaceholder && <CoinIconIndicator isPinned={isPinned} style={sx.coinIconIndicator} theme={theme} />}

          {selected && (
            <View style={[sx.checkmarkBackground, checkmarkBackgroundDynamicStyle]}>
              <Icon color="white" name="checkmark" />
            </View>
          )}
        </View>
      </ButtonPressAnimation>
    </View>
  );
});

function formatPercentageString(percentString?: string) {
  if (!percentString) return '0.00%';
  const formatted = percentString.split('-').join('- ');
  return formatted.endsWith('%') ? formatted : `${formatted}%`;
}

function formatPercentChange(percentChange: string | undefined) {
  if (!percentChange) return '-';
  return formatPercentageString(toSignificantDigits({ value: percentChange, minDecimalPlaces: 2, minRepresentable: 0.01 }));
}

function tokenPriceChangeSelector(token: TokenData) {
  return formatPercentChange(token.change.change24hPct);
}

interface MemoizedBalanceCoinRowProps {
  uniqueId: string;
  nativeCurrency: NativeCurrencyKey;
  theme: any;
  nativeCurrencySymbol: string;
  isHidden: boolean;
  maybeCallback: React.RefObject<null | (() => void)>;
}

const MemoizedBalanceCoinRow = React.memo(
  ({ uniqueId, nativeCurrency, theme, nativeCurrencySymbol, isHidden, maybeCallback }: MemoizedBalanceCoinRowProps) => {
    const item = useAccountAsset(uniqueId, nativeCurrency);
    const nativeBalanceDisplay = item?.balance?.display ?? '';
    const chainId = item?.chainId || ChainId.mainnet;
    const tokenBalanceAmount = item?.balance?.amount ?? '0';
    const percentChange = item?.native?.change?.replace('%', '');
    const priceUpdatedAt = item?.price?.changed_at ?? 0;

    const handlePress = useCallback(() => {
      if (maybeCallback.current) {
        maybeCallback.current();
      } else {
        if (!item) return;
        Navigation.handleAction(Routes.EXPANDED_ASSET_SHEET_V2, { asset: item, address: item.address, chainId: item.chainId });
      }
    }, [item, maybeCallback]);

    const tokenBalanceSelector = useCallback(
      (token: TokenData) => {
        return getBalance({ token, balanceAmount: tokenBalanceAmount, nativeCurrency });
      },
      [tokenBalanceAmount, nativeCurrency]
    );

    return (
      <View style={sx.flex} testID={'fast-coin-info'}>
        <ButtonPressAnimation onPress={handlePress} scaleTo={0.96} testID={`balance-coin-row-${item?.name}`}>
          <View style={[sx.container]}>
            <View style={sx.iconContainer}>
              <RainbowCoinIcon
                icon={item?.icon_url}
                chainId={chainId}
                symbol={item?.symbol || ''}
                color={item?.colors?.primary || item?.colors?.fallback || undefined}
              />
            </View>

            <View style={[sx.innerContainer, isHidden && sx.hiddenRow]}>
              <View style={sx.row}>
                <View style={sx.textWrapper}>
                  <Text numberOfLines={1} color="primary (Deprecated)" size="16px / 22px (Deprecated)" weight="semibold">
                    {item?.name}
                  </Text>
                </View>
                <LiveTokenText
                  selector={tokenBalanceSelector}
                  tokenId={uniqueId}
                  initialValueLastUpdated={priceUpdatedAt}
                  initialValue={item?.native?.balance?.display ?? `${nativeCurrencySymbol}0.00`}
                  autoSubscriptionEnabled={false}
                  color={{ custom: theme.colors.dark }}
                  size={'16px / 22px (Deprecated)'}
                  weight="bold"
                  align="right"
                />
              </View>

              <View style={[sx.row, sx.bottom]}>
                <View style={sx.textWrapper}>
                  <Text color={{ custom: theme.colors.blueGreyDark50 }} numberOfLines={1} size="14px / 19px (Deprecated)" weight="bold">
                    {nativeBalanceDisplay}
                  </Text>
                </View>
                <LiveTokenText
                  selector={tokenPriceChangeSelector}
                  tokenId={uniqueId}
                  initialValueLastUpdated={priceUpdatedAt}
                  initialValue={formatPercentChange(percentChange)}
                  autoSubscriptionEnabled={false}
                  usePriceChangeColor
                  priceChangeChangeColors={{
                    positive: theme.colors.green,
                    negative: theme.colors.blueGreyDark50,
                    neutral: theme.colors.blueGreyDark50,
                  }}
                  color={'label'}
                  size="14px / 19px (Deprecated)"
                  weight="bold"
                  align="right"
                />
              </View>
            </View>
          </View>
        </ButtonPressAnimation>
      </View>
    );
  }
);

MemoizedBalanceCoinRow.displayName = 'MemoizedBalanceCoinRow';

export default React.memo(function BalanceCoinRow({ uniqueId, extendedState }: { uniqueId: string; extendedState: ExtendedState }) {
  const { theme, nativeCurrencySymbol, nativeCurrency, hiddenAssets, pinnedCoins, toggleSelectedCoin, isCoinListEdited } = extendedState;

  const onPress = useCallback(() => {
    toggleSelectedCoin(uniqueId);
  }, [uniqueId, toggleSelectedCoin]);

  // HACK to make sure we don't rerender MemoizedBalanceCoinRow
  // when isCoinListEdited === true and we need to change onPress callback
  const maybeCallback = useRef<null | (() => void)>(null);
  maybeCallback.current = isCoinListEdited ? onPress : null;

  const isHidden = hiddenAssets.has(uniqueId);
  const isPinned = pinnedCoins[uniqueId];

  return (
    <View style={[sx.rootContainer, !isCoinListEdited && sx.nonEditMode]}>
      {isCoinListEdited && <CoinCheckButton isHidden={isHidden} isPinned={isPinned} onPress={onPress} theme={theme} uniqueId={uniqueId} />}

      <MemoizedBalanceCoinRow
        isHidden={isHidden}
        maybeCallback={maybeCallback}
        nativeCurrency={nativeCurrency}
        nativeCurrencySymbol={nativeCurrencySymbol}
        theme={theme}
        uniqueId={uniqueId}
      />
    </View>
  );
});

const sx = StyleSheet.create({
  bottom: {
    marginTop: 10,
  },
  iconContainer: {
    elevation: 6,
    height: 59,
    overflow: 'visible',
    paddingTop: 9,
  },
  checkboxContainer: {
    alignSelf: 'center',
    marginRight: -4,
    width: 51,
  },
  checkboxInnerContainer: {
    alignContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    height: 40,
    justifyContent: 'center',
    width: 51,
  },
  checkmarkBackground: {
    ...borders.buildCircleAsObject(22),
    ...padding.object(4.5),
    backgroundColor: colors.appleBlue,
    left: 19,
    position: 'absolute',
  },
  circleOutline: {
    ...borders.buildCircleAsObject(22),
    borderWidth: 1.5,
    left: 19,
    position: 'absolute',
  },
  coinIconIndicator: {
    left: 19,
    position: 'absolute',
  },
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    marginRight: 19,
    overflow: 'visible',
    paddingLeft: 9,
  },
  flex: {
    flex: 1,
  },
  hiddenRow: {
    opacity: 0.4,
  },
  innerContainer: {
    flex: 1,
    marginBottom: 1,
    marginLeft: 10,
  },
  nonEditMode: {
    paddingLeft: 10,
  },
  rootContainer: {
    flex: 1,
    flexDirection: 'row',
    overflow: 'visible',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  textWrapper: {
    flex: 1,
    paddingRight: 19,
  },
});
