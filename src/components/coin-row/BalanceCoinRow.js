import { get } from 'lodash';
import React, { Fragment, useCallback } from 'react';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { View } from 'react-primitives';
import useCoinListEditOptions from '../../hooks/useCoinListEditOptions';
import { useTheme } from '../../theme/ThemeContext';
import { ButtonPressAnimation } from '../animations';
import { initialChartExpandedStateSheetHeight } from '../expanded-state/asset/ChartExpandedState';
import { FlexItem, Row } from '../layout';
import BalanceText from './BalanceText';
import BottomRowText from './BottomRowText';
import CoinCheckButton from './CoinCheckButton';
import CoinName from './CoinName';
import CoinRow from './CoinRow';
import { useIsCoinListEditedSharedValue } from '@rainbow-me/helpers/SharedValuesContext';
import { buildAssetUniqueIdentifier } from '@rainbow-me/helpers/assets';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import styled from '@rainbow-me/styled-components';

const editTranslateOffset = 37;

const formatPercentageString = percentString =>
  percentString ? percentString.split('-').join('- ') : '-';

const BalanceCoinRowCoinCheckButton = styled(CoinCheckButton).attrs({
  left: 9.5,
})({
  top: 9,
});

const PercentageText = styled(BottomRowText).attrs({
  align: 'right',
})({
  color: ({ isPositive, theme: { colors } }) =>
    isPositive ? colors.green : colors.alpha(colors.blueGreyDark, 0.5),
});

const BottomRowContainer = ios
  ? Fragment
  : styled(Row).attrs({ marginBottom: 10, marginTop: -10 })({});

const TopRowContainer = ios
  ? Fragment
  : styled(Row).attrs({
      align: 'flex-start',
      justify: 'flex-start',
      marginTop: 0,
    })({});

const PriceContainer = ios
  ? View
  : styled(View)({
      marginBottom: 3,
      marginTop: -3,
    });

const BottomRow = ({ balance, native }) => {
  const { colors } = useTheme();
  const percentChange = get(native, 'change');
  const percentageChangeDisplay = formatPercentageString(percentChange);

  const isPositive = percentChange && percentageChangeDisplay.charAt(0) !== '-';

  return (
    <BottomRowContainer>
      <FlexItem flex={1}>
        <BottomRowText color={colors.alpha(colors.blueGreyDark, 0.5)}>
          {get(balance, 'display', '')}
        </BottomRowText>
      </FlexItem>
      <View>
        <PercentageText isPositive={isPositive}>
          {percentageChangeDisplay}
        </PercentageText>
      </View>
    </BottomRowContainer>
  );
};

const TopRow = ({ name, native, nativeCurrencySymbol }) => {
  const nativeDisplay = get(native, 'balance.display');
  const { colors } = useTheme();

  return (
    <TopRowContainer>
      <FlexItem flex={1}>
        <CoinName>{name}</CoinName>
      </FlexItem>
      <PriceContainer>
        <BalanceText
          color={nativeDisplay ? colors.dark : colors.blueGreyLight}
          numberOfLines={1}
        >
          {nativeDisplay || `${nativeCurrencySymbol}0.00`}
        </BalanceText>
      </PriceContainer>
    </TopRowContainer>
  );
};

const arePropsEqual = (prev, next) => {
  const itemIdentifier = buildAssetUniqueIdentifier(prev.item);
  const nextItemIdentifier = buildAssetUniqueIdentifier(next.item);
  const isSameItem = itemIdentifier === nextItemIdentifier;
  return isSameItem;
};

const BalanceCoinRow = ({
  containerStyles = null,
  isFirstCoinRow = false,
  item,
  ...props
}) => {
  const { toggleSelectedCoin } = useCoinListEditOptions();
  const isCoinListEditedSharedValue = useIsCoinListEditedSharedValue();
  const { navigate } = useNavigation();

  const handleEditModePress = useCallback(() => {
    toggleSelectedCoin(item.uniqueId);
  }, [item.uniqueId, toggleSelectedCoin]);

  const handlePress = useCallback(() => {
    if (isCoinListEditedSharedValue.value) {
      handleEditModePress();
    } else {
      navigate(Routes.EXPANDED_ASSET_SHEET, {
        asset: item,
        fromDiscover: true,
        longFormHeight: initialChartExpandedStateSheetHeight,
        type: 'token',
      });
    }
  }, [isCoinListEditedSharedValue, handleEditModePress, navigate, item]);

  const paddingStyle = useAnimatedStyle(
    () => ({
      paddingLeft:
        (isCoinListEditedSharedValue.value ? 1 : 0) * editTranslateOffset,
      position: 'absolute',
      width: '100%',
    }),
    []
  );

  const marginStyle = useAnimatedStyle(
    () => ({
      marginLeft:
        -editTranslateOffset *
        1.5 *
        (isCoinListEditedSharedValue.value ? 0 : 1),
      position: 'absolute',
    }),
    []
  );

  const { hiddenCoinsObj, pinnedCoinsObj } = useCoinListEditOptions();
  const isPinned = pinnedCoinsObj[item.uniqueId];
  const isHidden = hiddenCoinsObj[item.uniqueId];
  return (
    <Row flex={1}>
      <Animated.View style={paddingStyle}>
        <ButtonPressAnimation
          onPress={handlePress}
          scaleTo={0.96}
          testID={`balance-coin-row-${item.name}`}
        >
          <Animated.View>
            <CoinRow
              bottomRowRender={BottomRow}
              containerStyles={containerStyles}
              isFirstCoinRow={isFirstCoinRow}
              isHidden={isHidden}
              isPinned={isPinned}
              onPress={handlePress}
              topRowRender={TopRow}
              {...item}
              {...props}
            />
          </Animated.View>
        </ButtonPressAnimation>
      </Animated.View>
      <Animated.View style={marginStyle}>
        <BalanceCoinRowCoinCheckButton
          isHidden={isHidden}
          isPinned={isPinned}
          onPress={handleEditModePress}
          uniqueId={item.uniqueId}
        />
      </Animated.View>
    </Row>
  );
};

export default React.memo(BalanceCoinRow, arePropsEqual);
