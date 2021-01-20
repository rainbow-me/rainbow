import React, { useCallback, useState } from 'react';
import styled, { css } from 'styled-components/primitives';
import { ButtonPressAnimation } from '../animations';
import { CoinIconSize } from '../coin-icon';
import { FloatingEmojis } from '../floating-emojis';
import { Centered, ColumnWithMargins } from '../layout';
import BalanceText from './BalanceText';
import BottomRowText from './BottomRowText';
import CoinName from './CoinName';
import CoinRow from './CoinRow';
import CoinRowFavoriteButton from './CoinRowFavoriteButton';
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

const BottomRow = ({ showBalance, symbol }) =>
  showBalance ? null : <BottomRowText>{symbol}</BottomRowText>;

const TopRow = ({ name, showBalance }) => (
  <Centered height={showBalance ? CoinIconSize : null}>
    <CoinName>{name}</CoinName>
  </Centered>
);

const ExchangeCoinRow = ({
  item,
  isVerified,
  onFavoriteAsset,
  onPress,
  onUnverifiedTokenPress,
  showBalance,
  showFavoriteButton,
}) => {
  const { width: deviceWidth } = useDimensions();
  const [localFavorite, setLocalFavorite] = useState(!!item.favorite);

  const handlePress = useCallback(() => {
    if (isVerified) {
      onPress(item);
    } else {
      onUnverifiedTokenPress(item);
    }
  }, [isVerified, item, onPress, onUnverifiedTokenPress]);

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
              showFavoriteButton ? 38 : 0,
              CoinRowPaddingBottom,
              15
            )
          )}
          showBalance={showBalance}
          testID="exchange-coin-row"
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
                  onFavoriteAsset(item, newLocalFavorite);
                  return newLocalFavorite;
                });
              }}
            />
          )}
        </FloatingFavoriteEmojis>
      )}
    </>
  );
};

export default neverRerender(ExchangeCoinRow);
