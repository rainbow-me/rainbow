import lang from 'i18n-js';
import React, { useCallback, useEffect, useMemo } from 'react';
import styled from 'styled-components/primitives';
import EditOptions from '../../../helpers/editOptionTypes';
import {
  convertAmountToNativeDisplay,
  toFixedDecimals,
} from '../../../helpers/utilities';
import { useAccountSettings, useCoinListEditOptions } from '../../../hooks';
import { magicMemo } from '../../../utils';
import { CoinIcon } from '../../coin-icon';
import { ContextCircleButton } from '../../context-menu';
import { Icon } from '../../icons';
import { ColumnWithMargins, Row, RowWithMargins } from '../../layout';
import { TruncatedText } from '../../text';
import { colors, padding } from '@rainbow-me/styles';

const noPriceData = 'No price data';

const Container = styled(ColumnWithMargins).attrs({
  margin: 12,
})`
  ${padding(0, 19, 30)};
`;

const Title = styled(TruncatedText).attrs(({ color = colors.dark }) => ({
  color,
  letterSpacing: 'roundedTight',
  size: 'big',
  weight: 'bold',
}))``;

const Subtitle = styled(TruncatedText).attrs(
  ({ color = colors.alpha(colors.blueGreyDark, 0.8) }) => ({
    color,
    letterSpacing: 'roundedTight',
    size: 'larger',
    weight: 'medium',
  })
)``;

const ChartExpandedStateHeader = ({
  address,
  change,
  chartPrice,
  color = colors.dark,
  isPositiveChange,
  latestPrice = noPriceData,
  name,
  shadowColor,
  symbol,
  uniqueId,
}) => {
  const { nativeCurrency } = useAccountSettings();
  const {
    clearSelectedCoins,
    currentAction,
    pushSelectedCoin,
    setHiddenCoins,
    setPinnedCoins,
  } = useCoinListEditOptions();

  useEffect(() => {
    // Ensure this expanded state's asset is always actively inside
    // the CoinListEditOptions selection queue
    pushSelectedCoin(uniqueId);

    // Clear CoinListEditOptions selection queue on unmount.
    return () => clearSelectedCoins();
  }, [clearSelectedCoins, currentAction, pushSelectedCoin, uniqueId]);

  const coinIconShadow = useMemo(
    () => [[0, 4, 12, shadowColor || color, 0.3]],
    [color, shadowColor]
  );

  const contextButtonOptions = useMemo(
    () => [
      `📌️ ${currentAction === EditOptions.unpin ? 'Unpin' : 'Pin'}`,
      `🙈️ ${currentAction === EditOptions.unhide ? 'Unhide' : 'Hide'}`,
      lang.t('wallet.action.cancel'),
    ],
    [currentAction]
  );

  const formattedChange = useMemo(
    () => `${Math.abs(Number(toFixedDecimals(change, 2)))}%`,
    [change]
  );

  const formattedPrice = useMemo(
    () =>
      chartPrice
        ? convertAmountToNativeDisplay(chartPrice, nativeCurrency)
        : latestPrice,
    [chartPrice, latestPrice, nativeCurrency]
  );

  const handleActionSheetPress = useCallback(
    buttonIndex => {
      if (buttonIndex === 0) {
        // 📌️ Pin
        setPinnedCoins();
      } else if (buttonIndex === 1) {
        // 🙈️ Hide
        setHiddenCoins();
      }
    },
    [setHiddenCoins, setPinnedCoins]
  );

  const isNoPriceData = formattedPrice === noPriceData;

  return (
    <Container>
      <Row align="center" justify="space-between">
        <CoinIcon address={address} shadow={coinIconShadow} symbol={symbol} />
        <ContextCircleButton
          flex={0}
          onPressActionSheet={handleActionSheetPress}
          options={contextButtonOptions}
          tintColor={color}
        />
      </Row>
      <Row align="center" justify="space-between">
        <ColumnWithMargins align="start" flex={1} margin={4}>
          <Title>{isNoPriceData ? name : formattedPrice}</Title>
          <Subtitle>{isNoPriceData ? formattedPrice : name}</Subtitle>
        </ColumnWithMargins>
        {!isNoPriceData && (
          <ColumnWithMargins align="end" margin={4}>
            <RowWithMargins align="center" margin={4}>
              <Icon
                color={color}
                direction={isPositiveChange ? 'left' : 'right'}
                name="fatArrow"
                width={15}
              />
              <Title color={color}>{formattedChange}</Title>
            </RowWithMargins>
            <Subtitle color={color}>Today</Subtitle>
          </ColumnWithMargins>
        )}
      </Row>
    </Container>
  );
};

export default magicMemo(ChartExpandedStateHeader, [
  'chartPrice',
  'color',
  'latestPrice',
  'shadowColor',
]);
