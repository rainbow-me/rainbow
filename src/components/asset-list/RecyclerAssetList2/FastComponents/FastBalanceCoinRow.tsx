import React, { useCallback, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { type ParsedSearchAsset } from '@/__swaps__/types/assets';
import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import CoinIconIndicator from '@/components/coin-icon/CoinIconIndicator';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { Icon } from '@/components/icons';
import { LiveTokenText } from '@/components/live-token-text/LiveTokenText';
import { Text } from '@/design-system';
import { opacity } from '@/design-system/utils/opacity';
import type { NativeCurrencyKey } from '@/features/currency/types';
import { formatLiquidityCappedBalance } from '@/features/token/ui/utils/formatLiquidityCappedBalance';
import { selectedCoinsActions, useSelectedCoinsStore } from '@/features/wallet/data/walletScreen/base/selectedCoinsStore';
import { type ExtendedState } from '@/features/wallet/data/walletScreen/composition/useExtendedState';
import { memoizeLast } from '@/framework/core/utils/memoizeLast';
import { toSignificantDigits } from '@/helpers/utilities';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { select24hChange } from '@/state/liveTokens/selectors';
import { type TokenData } from '@/state/liveTokens/types';
import { borders, colors, padding, shadow } from '@/styles';
import isLowerCaseMatch from '@/utils/isLowerCaseMatch';

interface CoinCheckButtonProps {
  isHidden: boolean;
  isPinned: boolean;
  onPress: () => void;
  uniqueId: string;
  theme: ExtendedState['theme'];
}

const CoinCheckButton = React.memo(function CoinCheckButton({ isHidden, isPinned, onPress, uniqueId, theme }: CoinCheckButtonProps) {
  const selected = useSelectedCoinsStore(s => s.selectedItems.includes(uniqueId));

  const showOutline = !(isHidden || isPinned);
  const coinIconPlaceholder = !selected && (isHidden || isPinned);

  const checkmarkBackgroundDynamicStyle = {
    ...shadow.buildAsObject(0, 4, 12, theme.isDarkMode ? colors.shadow : colors.appleBlue, 0.4),
  };

  return (
    <View style={sx.checkboxContainer}>
      <ButtonPressAnimation onPress={onPress}>
        <View style={sx.checkboxInnerContainer}>
          {showOutline && <View style={[sx.circleOutline, { borderColor: opacity(colors.blueGreyDark, 0.12) }]} />}

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

interface MemoizedBalanceCoinRowProps {
  asset: ParsedSearchAsset;
  nativeCurrency: NativeCurrencyKey;
  theme: ExtendedState['theme'];
  isHidden: boolean;
  maybeCallback: React.RefObject<null | (() => void)>;
}

const MemoizedBalanceCoinRow = React.memo(function MemoizedBalanceCoinRow({
  asset,
  nativeCurrency,
  theme,
  isHidden,
  maybeCallback,
}: MemoizedBalanceCoinRowProps) {
  const tokenBalanceAmount = asset.balance.amount;
  const percentChange =
    asset.price?.relative_change_24h && !isLowerCaseMatch(asset.symbol, nativeCurrency) ? asset.native.price?.change : undefined;
  const priceUpdatedAt = asset.price?.changed_at ?? 0;

  const handlePress = useCallback(() => {
    if (maybeCallback.current) {
      maybeCallback.current();
    } else {
      Navigation.handleAction(Routes.EXPANDED_ASSET_SHEET_V2, { asset, address: asset.address, chainId: asset.chainId });
    }
  }, [asset, maybeCallback]);

  const tokenBalanceSelector = useMemo(
    () =>
      memoizeLast((token: TokenData) => {
        const result = formatLiquidityCappedBalance(token, tokenBalanceAmount, nativeCurrency);
        return `${result.isCapped ? '~' : ''}${result.balance}`;
      }),
    [nativeCurrency, tokenBalanceAmount]
  );

  return (
    <View style={sx.flex} testID={'fast-coin-info'}>
      <ButtonPressAnimation onPress={handlePress} scaleTo={0.96} testID={`balance-coin-row-${asset.name}`}>
        <View style={[sx.container]}>
          <View style={sx.iconContainer}>
            <RainbowCoinIcon
              icon={asset.icon_url}
              chainId={asset.chainId}
              symbol={asset.symbol}
              color={asset.colors?.primary || asset.colors?.fallback || undefined}
            />
          </View>

          <View style={[sx.innerContainer, isHidden && sx.hiddenRow]}>
            <View style={sx.row}>
              <View style={sx.textWrapper}>
                <Text numberOfLines={1} color="primary (Deprecated)" size="16px / 22px (Deprecated)" weight="semibold">
                  {asset.name}
                </Text>
              </View>
              <LiveTokenText
                autoSubscribe={false}
                selector={tokenBalanceSelector}
                tokenId={asset.uniqueId}
                // A changed token quantity must use the live price even if that price is unchanged.
                fallbackUpdatedAt={0}
                fallback={asset.native.balance.display}
                color={{ custom: theme.colors.dark }}
                size={'16px / 22px (Deprecated)'}
                weight="bold"
                align="right"
                testID={`balance-coin-row-value-${asset.name}`}
              />
            </View>

            <View style={[sx.row, sx.bottom]}>
              <View style={sx.textWrapper}>
                <Text color={{ custom: theme.colors.blueGreyDark50 }} numberOfLines={1} size="14px / 19px (Deprecated)" weight="bold">
                  {asset.balance.display}
                </Text>
              </View>
              <LiveTokenText
                autoSubscribe={false}
                selector={select24hChange}
                format={formatPercentChange}
                tokenId={asset.uniqueId}
                fallbackUpdatedAt={priceUpdatedAt}
                fallback={formatPercentChange(percentChange)}
                priceChangeColors={{
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
});

export default React.memo(function BalanceCoinRow({
  asset,
  extendedState,
  isPinned,
  isHidden,
}: {
  asset: ParsedSearchAsset;
  extendedState: ExtendedState;
  isPinned: boolean;
  isHidden: boolean;
}) {
  const { theme, nativeCurrency, isCoinListEdited } = extendedState;
  const uniqueId = asset.uniqueId;

  const onPress = useCallback(() => {
    selectedCoinsActions.toggleSelectedCoin(uniqueId);
  }, [uniqueId]);

  // HACK to make sure we don't rerender MemoizedBalanceCoinRow
  // when isCoinListEdited === true and we need to change onPress callback
  const maybeCallback = useRef<null | (() => void)>(null);
  maybeCallback.current = isCoinListEdited ? onPress : null;

  return (
    <View style={[sx.rootContainer, !isCoinListEdited && sx.nonEditMode]}>
      {isCoinListEdited && <CoinCheckButton isHidden={isHidden} isPinned={isPinned} onPress={onPress} theme={theme} uniqueId={uniqueId} />}

      <MemoizedBalanceCoinRow
        asset={asset}
        isHidden={isHidden}
        maybeCallback={maybeCallback}
        nativeCurrency={nativeCurrency}
        theme={theme}
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
