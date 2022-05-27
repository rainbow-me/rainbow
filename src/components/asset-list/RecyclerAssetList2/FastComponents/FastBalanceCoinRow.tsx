import React, { useCallback, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { CoinIconIndicator } from '../../../../components/coin-icon';
import { Icon } from '../../../../components/icons';
import { ButtonPressAnimation } from '../../../animations';

import { initialChartExpandedStateSheetHeight } from '../../../expanded-state/asset/ChartExpandedState';
import { ExtendedState } from '../core/RawRecyclerList';
import FastCoinIcon from './FastCoinIcon';
import { Text } from '@rainbow-me/design-system';
import {
  useAccountAsset,
  useCoinListFinishEditingOptions,
} from '@rainbow-me/hooks';
import Routes from '@rainbow-me/routes';
import { borders, colors, padding, shadow } from '@rainbow-me/styles';

interface CoinCheckButtonProps {
  isHidden: boolean;
  isPinned: boolean;
  onPress: () => void;
  uniqueId: string;
  theme: any;
}

const CoinCheckButton = React.memo(function CoinCheckButton({
  isHidden,
  isPinned,
  onPress,
  uniqueId,
  theme,
}: CoinCheckButtonProps) {
  const { selectedItems } = useCoinListFinishEditingOptions();
  const selected = selectedItems.includes(uniqueId);

  const showOutline = !(isHidden || isPinned);
  const coinIconPlaceholder = !selected && (isHidden || isPinned);

  const checkmarkBackgroundDynamicStyle = {
    ...shadow.buildAsObject(
      0,
      4,
      12,
      theme.isDarkMode ? colors.shadow : colors.appleBlue,
      0.4
    ),
  };

  return (
    <View style={cx.checkboxContainer}>
      <ButtonPressAnimation onPress={onPress}>
        <View style={cx.checkboxInnerContainer}>
          {showOutline && (
            <View
              style={[
                cx.circleOutline,
                { borderColor: colors.alpha(colors.blueGreyDark, 0.12) },
              ]}
            />
          )}

          {coinIconPlaceholder && (
            <CoinIconIndicator
              // @ts-expect-error
              isPinned={isPinned}
              style={cx.coinIconIndicator}
              theme={theme}
            />
          )}

          {selected && (
            <View
              style={[cx.checkmarkBackground, checkmarkBackgroundDynamicStyle]}
            >
              <Icon color="white" name="checkmark" />
            </View>
          )}
        </View>
      </ButtonPressAnimation>
    </View>
  );
});

const formatPercentageString = (percentString?: string) =>
  percentString ? percentString.split('-').join('- ') : '-';

interface MemoizedBalanceCoinRowProps {
  uniqueId: string;
  nativeCurrency: string;
  theme: any;
  navigate: any;
  nativeCurrencySymbol: string;
  isHidden: boolean;
  maybeCallback: React.RefObject<null | (() => void)>;
}

const MemoizedBalanceCoinRow = React.memo(
  ({
    uniqueId,
    nativeCurrency,
    theme,
    navigate,
    nativeCurrencySymbol,
    isHidden,
    maybeCallback,
  }: MemoizedBalanceCoinRowProps) => {
    const item = useAccountAsset(uniqueId, nativeCurrency);

    const handlePress = useCallback(() => {
      if (maybeCallback.current) {
        maybeCallback.current();
      } else {
        navigate(Routes.EXPANDED_ASSET_SHEET, {
          asset: item,
          fromDiscover: true,
          longFormHeight: initialChartExpandedStateSheetHeight,
          type: 'token',
        });
      }
    }, [navigate, item, maybeCallback]);

    const percentChange = item?.native?.change;
    const percentageChangeDisplay = formatPercentageString(percentChange);

    const isPositive =
      percentChange && percentageChangeDisplay.charAt(0) !== '-';

    const changeColor = isPositive
      ? theme.colors.green
      : theme.colors.blueGreyDark50;

    const nativeDisplay = item?.balance?.display;

    const valueColor = nativeDisplay
      ? theme.colors.dark
      : theme.colors.blueGreyLight;

    return (
      <View style={cx.flex}>
        <ButtonPressAnimation
          onPress={handlePress}
          scaleTo={0.96}
          testID={`balance-coin-row-${item.name}`}
        >
          <View style={[cx.container]}>
            <FastCoinIcon
              address={item.mainnet_address ?? item.address}
              assetType={item.type}
              symbol={item.symbol}
              theme={theme}
            />

            <View style={[cx.innerContainer, isHidden && cx.hiddenRow]}>
              <View style={cx.row}>
                <Text
                  align="right"
                  numberOfLines={1}
                  size="16px"
                  weight="medium"
                >
                  {item.name}
                </Text>

                <Text
                  align="right"
                  color={{ custom: valueColor }}
                  size="16px"
                  weight="medium"
                >
                  {item?.native?.balance?.display ??
                    `${nativeCurrencySymbol}0.00`}
                </Text>
              </View>

              <View style={[cx.row, cx.bottom]}>
                <Text
                  color={{ custom: theme.colors.blueGreyDark50 }}
                  size="14px"
                >
                  {nativeDisplay ?? ''}
                </Text>

                <Text color={{ custom: changeColor }} size="14px">
                  {percentageChangeDisplay}
                </Text>
              </View>
            </View>
          </View>
        </ButtonPressAnimation>
      </View>
    );
  }
);

MemoizedBalanceCoinRow.displayName = 'MemoizedBalanceCoinRow';

export default React.memo(function BalanceCoinRow({
  uniqueId,
  extendedState,
}: {
  uniqueId: string;
  extendedState: ExtendedState;
}) {
  const {
    theme,
    nativeCurrencySymbol,
    navigate,
    nativeCurrency,
    hiddenCoins,
    pinnedCoins,
    toggleSelectedCoin,
    isCoinListEdited,
  } = extendedState;

  const onPress = useCallback(() => {
    toggleSelectedCoin(uniqueId);
  }, [uniqueId, toggleSelectedCoin]);

  // HACK to make sure we don't rerender MemoizedBalanceCoinRow
  // when isCoinListEdited === true and we need to change onPress callback
  const maybeCallback = useRef<null | (() => void)>(null);
  maybeCallback.current = isCoinListEdited ? onPress : null;

  // we return false to make sure we don't run includes for each row when it's not needed
  const isHidden = isCoinListEdited ? hiddenCoins[uniqueId] : false;
  const isPinned = isCoinListEdited ? pinnedCoins[uniqueId] : false;

  return (
    <View style={[cx.rootContainer, !isCoinListEdited && cx.nonEditMode]}>
      {isCoinListEdited && (
        <CoinCheckButton
          isHidden={isHidden}
          isPinned={isPinned}
          onPress={onPress}
          theme={theme}
          uniqueId={uniqueId}
        />
      )}

      <MemoizedBalanceCoinRow
        isHidden={isHidden}
        maybeCallback={maybeCallback}
        nativeCurrency={nativeCurrency}
        nativeCurrencySymbol={nativeCurrencySymbol}
        navigate={navigate}
        theme={theme}
        uniqueId={uniqueId}
      />
    </View>
  );
});

const cx = StyleSheet.create({
  bottom: {
    marginTop: 12,
  },
  checkboxContainer: {
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
  coinIconFallback: {
    backgroundColor: '#25292E',
    borderRadius: 20,
    height: 40,
    width: 40,
  },
  coinIconIndicator: {
    left: 19,
    position: 'absolute',
  },
  container: {
    flexDirection: 'row',
    marginLeft: 2,
    marginRight: 19,
    marginVertical: 9.5,
  },
  flex: {
    flex: 1,
  },
  hiddenRow: {
    opacity: 0.4,
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 10,
  },
  nonEditMode: {
    paddingLeft: 19,
  },
  rootContainer: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
