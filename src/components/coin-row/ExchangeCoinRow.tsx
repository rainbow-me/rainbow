import React, { useCallback, useState } from 'react';
import styled, { css } from 'styled-components';
import { ButtonPressAnimation } from '../animations';
import { CoinIconSize } from '../coin-icon';
import { FloatingEmojis } from '../floating-emojis';
import { ColumnWithMargins, Row } from '../layout';
import BalanceText from './BalanceText';
import BottomRowText from './BottomRowText';
import CoinName from './CoinName';
// @ts-expect-error ts-migrate(6142) FIXME: Module './CoinRow' was resolved to '/Users/nickbyt... Remove this comment to see the full error message
import CoinRow from './CoinRow';
// @ts-expect-error ts-migrate(6142) FIXME: Module './CoinRowAddButton' was resolved to '/User... Remove this comment to see the full error message
import CoinRowAddButton from './CoinRowAddButton';
// @ts-expect-error ts-migrate(6142) FIXME: Module './CoinRowFavoriteButton' was resolved to '... Remove this comment to see the full error message
import CoinRowFavoriteButton from './CoinRowFavoriteButton';
// @ts-expect-error ts-migrate(6142) FIXME: Module './CoinRowInfoButton' was resolved to '/Use... Remove this comment to see the full error message
import CoinRowInfoButton from './CoinRowInfoButton';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useDimensions } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
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

const BottomRow = ({ showBalance, symbol }: any) =>
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  showBalance ? null : <BottomRowText>{symbol}</BottomRowText>;

const TopRow = ({ name, showBalance }: any) => (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <Row align="center" height={showBalance ? CoinIconSize : null}>
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
    '--jsx' flag is provided... Remove this comment to see the full error
    message
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
}: any) => {
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ButtonPressAnimation
        height={CoinIconSize + CoinRowPaddingTop + CoinRowPaddingBottom}
        onPress={handlePress}
        scaleTo={0.96}
        throttle
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
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
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <ColumnWithMargins align="end" margin={4}>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <BalanceText>{item?.native?.balance?.display || '–'}</BalanceText>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <BottomRowText>{item?.balance?.display || ''}</BottomRowText>
            </ColumnWithMargins>
          )}
        </CoinRow>
      </ButtonPressAnimation>
      {!item.isNativeAsset && !showBalance && (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <CoinRowInfoButton
          item={item}
          onCopySwapDetailsText={onCopySwapDetailsText}
        />
      )}
      {showFavoriteButton && (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <FloatingFavoriteEmojis deviceWidth={deviceWidth}>
          {({ onNewEmoji }: any) => (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
