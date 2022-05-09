import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { CoinIconIndicator } from '../../../../components/coin-icon';
import { Icon } from '../../../../components/icons';
import { ButtonPressAnimation } from '../../../animations';

import { initialChartExpandedStateSheetHeight } from '../../../expanded-state/asset/ChartExpandedState';
import { ExtendedState } from '../core/RawRecyclerList';
import { Text } from '@rainbow-me/design-system';
import {
  useAccountAsset,
  useCoinListFinishEditingOptions,
} from '@rainbow-me/hooks';
import Routes from '@rainbow-me/routes';
import { borders, colors, padding, shadow } from '@rainbow-me/styles';

function CoinIcon() {
  return <View style={cx.coinIconFallback} />;
}

const CoinCheckButton = ({
  isHidden,
  isPinned,
  onPress,
  uniqueId,
  left,
  theme,
}) => {
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
};

const formatPercentageString = (percentString?: string) =>
  percentString ? percentString.split('-').join('- ') : '-';

const MemoizedBalanceCoinRow = React.memo(
  ({
    uniqueId,
    nativeCurrency,
    theme,
    navigate,
    nativeCurrencySymbol,
    isHidden,
    isCoinListEdited,
    isPinned,
    onCheckboxPress,
  }) => {
    const item = useAccountAsset(uniqueId, nativeCurrency);

    const handlePress = useCallback(() => {
      navigate(Routes.EXPANDED_ASSET_SHEET, {
        asset: item,
        fromDiscover: true,
        longFormHeight: initialChartExpandedStateSheetHeight,
        type: 'token',
      });
    }, [navigate, item]);

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
      <View style={cx.rootContainer}>
        {isCoinListEdited && (
          <CoinCheckButton
            isHidden={isHidden}
            isPinned={isPinned}
            onPress={onCheckboxPress}
            theme={theme}
            uniqueId={uniqueId}
          />
        )}

        <View style={cx.flex}>
          <ButtonPressAnimation
            onPress={isCoinListEdited ? onCheckboxPress : handlePress}
            scaleTo={0.96}
            testID={`balance-coin-row-${item.name}`}
          >
            <View style={[cx.container, !isCoinListEdited && cx.nonEditMode]}>
              <CoinIcon />

              <View style={[cx.innerContainer, isHidden && cx.hiddenRow]}>
                <View style={cx.row}>
                  <Text align="right" size="16px" weight="medium">
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
      </View>
    );
  }
);

MemoizedBalanceCoinRow.displayName = 'MemoizedBalanceCoinRow';

export default function BalanceCoinRow({
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

  const isHidden = isCoinListEdited ? false : hiddenCoins.includes(uniqueId);
  const isPinned = isCoinListEdited ? false : pinnedCoins.includes(uniqueId);

  const onPress = useCallback(() => {
    toggleSelectedCoin(uniqueId);
  }, [uniqueId, toggleSelectedCoin]);

  return (
    <MemoizedBalanceCoinRow
      isCoinListEdited={isCoinListEdited}
      isHidden={isHidden}
      isPinned={isPinned}
      nativeCurrency={nativeCurrency}
      nativeCurrencySymbol={nativeCurrencySymbol}
      navigate={navigate}
      onCheckboxPress={onPress}
      theme={theme}
      uniqueId={uniqueId}
    />
  );
}

const cx = StyleSheet.create({
  bottom: {
    marginTop: 12,
  },
  checkboxContainer: {
    width: 53,
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
    marginLeft: 19,
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
