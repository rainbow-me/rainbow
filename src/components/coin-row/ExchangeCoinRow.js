import React, { useCallback, useState } from 'react';
import styled, { css } from 'styled-components';
import { ButtonPressAnimation } from '../animations';
import { CoinIconSize } from '../coin-icon';
import { FloatingEmojis } from '../floating-emojis';
import { ColumnWithMargins, Row } from '../layout';
import BalanceText from './BalanceText';
import BottomRowText from './BottomRowText';
import CoinName from './CoinName';
import CoinRow from './CoinRow';
import CoinRowAddButton from './CoinRowAddButton';
import CoinRowFavoriteButton from './CoinRowFavoriteButton';
import CoinRowInfoButton from './CoinRowInfoButton';
import { useDimensions } from '@rainbow-me/hooks';
import { padding } from '@rainbow-me/styles';
import { haptics, neverRerender } from '@rainbow-me/utils';

const CoinRowPaddingTop = 9.5;
const CoinRowPaddingBottom = 9.5;

const FloatingFavoriteEmojis = styled(FloatingEmojis).attrs({
  centerVertically: true,
  disableHorizontalMovement: true,
  disableVerticalMovement: true,
  distance: 70,
  duration: 400,
  emojis: ['glowing_star'],
  fadeOut: false,
  marginTop: 10.25,
  range: [0, 0],
  scaleTo: 0,
  size: 32,
  wiggleFactor: 0,
})`
  left: ${({ deviceWidth }) => deviceWidth - 52.25};
  position: absolute;
  right: 0;
  top: 0;
  z-index: 100;
`;

const ExchangeCoinName = styled(CoinName)`
  width: ${({ showBalance }) => (showBalance ? '100%' : '90%')};
`;

const BottomRow = ({ showBalance, symbol }) =>
  showBalance ? null : <BottomRowText>{symbol}</BottomRowText>;

const TopRow = ({ name, showBalance }) => (
  <Row align="center" height={showBalance ? CoinIconSize : null}>
    <ExchangeCoinName showBalance={showBalance}>{name}</ExchangeCoinName>
  </Row>
);

const ExchangeCoinRow = ({
  item,
  isVerified,
  onActionAsset,
  onCopySwapDetailsText,
  onPress,
  onUnverifiedTokenPress,
  showBalance,
  showFavoriteButton,
  showAddButton,
  testID,
}) => {
  const { width: deviceWidth } = useDimensions();
  const [localFavorite, setLocalFavorite] = useState(!!item.favorite);

  const handlePress = useCallback(() => {
    if (isVerified || showBalance) {
      onPress(item);
    } else {
      onUnverifiedTokenPress(item);
    }
  }, [isVerified, item, onPress, onUnverifiedTokenPress, showBalance]);

  return (
    <>
      <ButtonPressAnimation
        height={CoinIconSize + CoinRowPaddingTop + CoinRowPaddingBottom}
        onPress={handlePress}
        scaleTo={0.96}
        throttle
      >
        <CoinRow
          {...item}
          bottomRowRender={BottomRow}
          containerStyles={css(
            padding(
              CoinRowPaddingTop,
              showFavoriteButton || showAddButton ? 38 : 0,
              CoinRowPaddingBottom,
              15
            )
          )}
          showBalance={showBalance}
          testID={`${testID}-exchange-coin-row`}
          topRowRender={TopRow}
        >
          {showBalance && (
            <ColumnWithMargins align="end" margin={4}>
              <BalanceText>{item?.native?.balance?.display || '–'}</BalanceText>
              <BottomRowText>{item?.balance?.display || ''}</BottomRowText>
            </ColumnWithMargins>
          )}
        </CoinRow>
      </ButtonPressAnimation>
      {!item.isNativeAsset && !showBalance && (
        <CoinRowInfoButton
          item={item}
          onCopySwapDetailsText={onCopySwapDetailsText}
        />
      )}
      {showFavoriteButton && (
        <FloatingFavoriteEmojis deviceWidth={deviceWidth}>
          {({ onNewEmoji }) => (
            <CoinRowFavoriteButton
              isFavorited={localFavorite}
              onPress={() => {
                setLocalFavorite(prevLocalFavorite => {
                  const newLocalFavorite = !prevLocalFavorite;
                  if (newLocalFavorite) {
                    haptics.notificationSuccess();
                    onNewEmoji();
                  } else {
                    haptics.selection();
                  }
                  onActionAsset(item, newLocalFavorite);
                  return newLocalFavorite;
                });
              }}
            />
          )}
        </FloatingFavoriteEmojis>
      )}
      {showAddButton && (
        <CoinRowAddButton
          onPress={() => {
            onActionAsset(item);
          }}
        />
      )}
    </>
  );
};

export default neverRerender(ExchangeCoinRow);
