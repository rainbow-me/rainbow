import lang from 'i18n-js';
import React, { useCallback, useEffect, useMemo } from 'react';
import styled from 'styled-components/primitives';
import { chartExpandedAvailable } from '../../../config/experimental';
import useExperimentalFlag, {
  RED_GREEN_PRICE_CHANGE,
} from '../../../config/experimentalHooks';
import EditOptions from '../../../helpers/editOptionTypes';
import {
  convertAmountToNativeDisplay,
  greaterThan,
  isEqual,
  toFixedDecimals,
} from '../../../helpers/utilities';
import { useAccountSettings, useCoinListEditOptions } from '../../../hooks';
import { magicMemo } from '../../../utils';
import { CoinIcon } from '../../coin-icon';
import { ContextCircleButton } from '../../context-menu';
import { Icon } from '../../icons';
import { Input } from '../../inputs';
import { ColumnWithMargins, Row, RowWithMargins } from '../../layout';
import { TruncatedText } from '../../text';
import { colors, padding } from '@rainbow-me/styles';

const noPriceData = 'No price data';

const Container = styled(ColumnWithMargins).attrs({
  margin: 12,
})`
  ${padding(0, 19, 24)};
`;

const Subtitle = styled(TruncatedText).attrs(
  ({
    color = colors.alpha(colors.blueGreyDark, 0.8),
    letterSpacing = 'roundedMedium',
  }) => ({
    color,
    letterSpacing,
    size: 'larger',
    weight: 'medium',
  })
)``;

const Title = styled(TruncatedText).attrs(({ color = colors.dark }) => ({
  color,
  letterSpacing: 'roundedTight',
  size: 'big',
  weight: 'bold',
}))``;

const ChartExpandedStateHeader = ({
  address,
  change,
  chartDateRef,
  chartPrice,
  chartPriceRef,
  color = colors.dark,
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

  const { isNoChange, isPositiveChange } = useMemo(
    () => ({
      isNoChange: isEqual(change, 0),
      isPositiveChange: greaterThan(change, 0),
    }),
    [change]
  );

  const redGreenPriceChange = useExperimentalFlag(RED_GREEN_PRICE_CHANGE);
  const redGreenColor = isPositiveChange
    ? colors.green
    : isNoChange
    ? colors.alpha(colors.blueGreyDark, 0.8)
    : colors.red;

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
        {!chartExpandedAvailable || isNoPriceData ? (
          <ColumnWithMargins align="start" flex={1} margin={1}>
            <Title>{isNoPriceData ? name : formattedPrice}</Title>
            <Subtitle>{isNoPriceData ? formattedPrice : name}</Subtitle>
          </ColumnWithMargins>
        ) : (
          <ColumnWithMargins align="start" flex={1} margin={1}>
            <Title
              as={Input}
              editable={false}
              flex={1}
              pointerEvent="none"
              ref={chartPriceRef}
            />
            <Subtitle>{name}</Subtitle>
          </ColumnWithMargins>
        )}
        {!isNoPriceData && (
          <ColumnWithMargins align="end" margin={1}>
            <RowWithMargins align="center" margin={4}>
              <Icon
                color={redGreenPriceChange ? redGreenColor : color}
                direction={isPositiveChange ? 'left' : 'right'}
                name="fatArrow"
                width={15}
              />
              <Title
                align="right"
                color={redGreenPriceChange ? redGreenColor : color}
              >
                {formattedChange}
              </Title>
            </RowWithMargins>
            {chartExpandedAvailable ? (
              <Subtitle
                align="right"
                as={Input}
                color={redGreenPriceChange ? redGreenColor : color}
                editable={false}
                letterSpacing="roundedTight"
                pointerEvent="none"
                ref={chartDateRef}
                tabularNums
              />
            ) : (
              <Subtitle
                align="right"
                color={redGreenPriceChange ? redGreenColor : color}
              >
                Today
              </Subtitle>
            )}
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
