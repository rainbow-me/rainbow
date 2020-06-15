import lang from 'i18n-js';
import React, { useCallback, useEffect, useMemo } from 'react';
import styled from 'styled-components/primitives';
import EditOptions from '../../../helpers/editOptionTypes';
import { toFixedDecimals } from '../../../helpers/utilities';
import { useAccountSettings, useCoinListEditOptions } from '../../../hooks';
import { colors, padding } from '../../../styles';
import { magicMemo } from '../../../utils';
import { CoinIcon } from '../../coin-icon';
import { ContextCircleButton } from '../../context-menu';
import { Icon } from '../../icons';
import { ColumnWithMargins, Row, RowWithMargins } from '../../layout';
import { TruncatedText } from '../../text';

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
  latestPrice = 'No price data',
  name,
  shadowColor,
  symbol,
  uniqueId,
}) => {
  const { nativeCurrencySymbol } = useAccountSettings();
  const {
    currentAction,
    pushSelectedCoin,
    setHiddenCoins,
    setPinnedCoins,
  } = useCoinListEditOptions();

  useEffect(() => {
    pushSelectedCoin(uniqueId);
  }, [currentAction, pushSelectedCoin, uniqueId]);

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

  const formattedPrice = useMemo(() => {
    const decimals = ((latestPrice || '').split('.')[1] || []).length;
    return chartPrice
      ? `${nativeCurrencySymbol}${chartPrice.toFixed(decimals)}`
      : latestPrice;
  }, [chartPrice, latestPrice, nativeCurrencySymbol]);

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
        <ColumnWithMargins align="start" margin={4}>
          <Title>{name}</Title>
          <Subtitle>{formattedPrice}</Subtitle>
        </ColumnWithMargins>
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
      </Row>
    </Container>
  );
};

export default magicMemo(ChartExpandedStateHeader, 'chartPrice');
