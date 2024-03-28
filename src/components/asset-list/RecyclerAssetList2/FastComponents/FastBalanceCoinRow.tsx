import React, { useCallback, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { CoinIconIndicator } from '../../../../components/coin-icon';
import { Icon } from '../../../../components/icons';
import { ButtonPressAnimation } from '../../../animations';

import { ExtendedState } from '../core/RawRecyclerList';

import { Text } from '@/design-system';
import { useAccountAsset, useCoinListFinishEditingOptions } from '@/hooks';
import Routes from '@/navigation/routesNames';
import { borders, colors, padding, shadow } from '@/styles';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';

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

const formatPercentageString = (percentString?: string) => (percentString ? percentString.split('-').join('- ') : '-');

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
  ({ uniqueId, nativeCurrency, theme, navigate, nativeCurrencySymbol, isHidden, maybeCallback }: MemoizedBalanceCoinRowProps) => {
    const item = useAccountAsset(uniqueId, nativeCurrency) as any;

    const handlePress = useCallback(() => {
      if (maybeCallback.current) {
        maybeCallback.current();
      } else {
        navigate(Routes.EXPANDED_ASSET_SHEET, {
          asset: item,
          fromDiscover: true,
          isFromWalletScreen: true,
          type: 'token',
        });
      }
    }, [navigate, item, maybeCallback]);

    const percentChange = item?.native?.change;
    const percentageChangeDisplay = formatPercentageString(percentChange);

    const isPositive = percentChange && percentageChangeDisplay.charAt(0) !== '-';

    const changeColor = isPositive ? theme.colors.green : theme.colors.blueGreyDark50;

    const nativeDisplay = item?.balance?.display;

    const valueColor = nativeDisplay ? theme.colors.dark : theme.colors.blueGreyLight;

    return (
      <View style={sx.flex}>
        <ButtonPressAnimation onPress={handlePress} scaleTo={0.96} testID={`balance-coin-row-${item?.name}`}>
          <View style={[sx.container]}>
            <View style={sx.iconContainer}>
              <RainbowCoinIcon
                size={40}
                icon={item?.icon_url}
                network={item?.network}
                symbol={item?.symbol}
                theme={theme}
                colors={item?.colors}
              />
            </View>

            <View style={[sx.innerContainer, isHidden && sx.hiddenRow]}>
              <View style={sx.row}>
                <View style={sx.textWrapper}>
                  <Text numberOfLines={1} color="primary (Deprecated)" size="16px / 22px (Deprecated)" weight="semibold">
                    {item?.name}
                  </Text>
                </View>

                <Text align="right" color={{ custom: valueColor }} size="16px / 22px (Deprecated)" weight="medium">
                  {item?.native?.balance?.display ?? `${nativeCurrencySymbol}0.00`}
                </Text>
              </View>

              <View style={[sx.row, sx.bottom]}>
                <View style={sx.textWrapper}>
                  <Text color={{ custom: theme.colors.blueGreyDark50 }} numberOfLines={1} size="14px / 19px (Deprecated)" weight="medium">
                    {nativeDisplay ?? ''}
                  </Text>
                </View>

                <Text align="right" color={{ custom: changeColor }} size="14px / 19px (Deprecated)" weight="medium">
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

export default React.memo(function BalanceCoinRow({ uniqueId, extendedState }: { uniqueId: string; extendedState: ExtendedState }) {
  const { theme, nativeCurrencySymbol, navigate, nativeCurrency, hiddenCoins, pinnedCoins, toggleSelectedCoin, isCoinListEdited } =
    extendedState;

  const onPress = useCallback(() => {
    toggleSelectedCoin(uniqueId);
  }, [uniqueId, toggleSelectedCoin]);

  // HACK to make sure we don't rerender MemoizedBalanceCoinRow
  // when isCoinListEdited === true and we need to change onPress callback
  const maybeCallback = useRef<null | (() => void)>(null);
  maybeCallback.current = isCoinListEdited ? onPress : null;

  const isHidden = hiddenCoins[uniqueId];
  const isPinned = pinnedCoins[uniqueId];

  return (
    <View style={[sx.rootContainer, !isCoinListEdited && sx.nonEditMode]}>
      {isCoinListEdited && <CoinCheckButton isHidden={isHidden} isPinned={isPinned} onPress={onPress} theme={theme} uniqueId={uniqueId} />}

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
