import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { InteractionManager, StyleSheet } from 'react-native';
import { useDimensions } from '../../hooks';
import { haptics } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { CoinIconSize } from '../coin-icon';
import { FloatingEmojis } from '../floating-emojis';
import { Centered, ColumnWithMargins } from '../layout';
import BalanceText from './BalanceText';
import BottomRowText from './BottomRowText';
import CoinName from './CoinName';
import CoinRow from './CoinRow';
import CoinRowFavoriteButton from './CoinRowFavoriteButton';

const CoinRowPaddingTop = 11;
const CoinRowPaddingBottom = 11;

const sx = StyleSheet.create({
  container: {
    paddingBottom: CoinRowPaddingBottom,
    paddingLeft: 15,
    paddingRight: 0,
    paddingTop: CoinRowPaddingTop,
  },
  containerWithFavorite: {
    paddingRight: 38,
  },
});

const BottomRow = ({ showBalance, symbol }) =>
  showBalance ? null : <BottomRowText>{symbol}</BottomRowText>;

BottomRow.propTypes = {
  showBalance: PropTypes.bool,
  symbol: PropTypes.string,
};

const TopRow = ({ name, showBalance }) => (
  <Centered height={showBalance ? CoinIconSize : null}>
    <CoinName>{name}</CoinName>
  </Centered>
);

TopRow.propTypes = {
  name: PropTypes.string,
  showBalance: PropTypes.bool,
};

const ExchangeCoinRow = ({
  item,
  onFavoriteAsset,
  onPress,
  showBalance,
  showFavoriteButton,
  ...props
}) => {
  const { width } = useDimensions();
  const [localFavorite, setLocalFavorite] = useState(!!item.favorite);

  return (
    <ButtonPressAnimation
      {...props}
      height={CoinIconSize + CoinRowPaddingTop + CoinRowPaddingBottom}
      onPress={() => onPress(item)}
      scaleTo={0.96}
    >
      <CoinRow
        {...item}
        bottomRowRender={BottomRow}
        containerStyles={[
          sx.container,
          showFavoriteButton ? sx.containerWithFavorite : null,
        ]}
        showBalance={showBalance}
        topRowRender={TopRow}
      >
        {showBalance && (
          <ColumnWithMargins align="end" margin={4} paddingRight={19}>
            <BalanceText>
              {get(item, 'native.balance.display', '–')}
            </BalanceText>
            <BottomRowText>{get(item, 'balance.display', '')}</BottomRowText>
          </ColumnWithMargins>
        )}
        {showFavoriteButton && (
          <FloatingEmojis
            centerVertically
            disableHorizontalMovement
            disableVerticalMovement
            distance={70}
            duration={400}
            emojis={['star2']}
            fadeOut={false}
            left={width - 46}
            marginTop={11}
            position="absolute"
            range={[0, 0]}
            right={0}
            scaleTo={0}
            size={32}
            top={0}
            wiggleFactor={0}
            zIndex={100}
          >
            {({ onNewEmoji }) => (
              <CoinRowFavoriteButton
                isFavorited={localFavorite}
                onPress={() => {
                  const newLocalFavorite = !localFavorite;
                  if (newLocalFavorite) {
                    haptics.impactMedium();
                    InteractionManager.runAfterInteractions(() => {
                      onNewEmoji();
                    });
                  }
                  setLocalFavorite(newLocalFavorite);
                  onFavoriteAsset(item.address, newLocalFavorite);
                }}
              />
            )}
          </FloatingEmojis>
        )}
      </CoinRow>
    </ButtonPressAnimation>
  );
};

ExchangeCoinRow.propTypes = {
  item: PropTypes.shape({
    address: PropTypes.string,
    favorite: PropTypes.bool,
    symbol: PropTypes.string,
  }),
  onFavoriteAsset: PropTypes.func,
  onPress: PropTypes.func,
  showBalance: PropTypes.bool,
  showFavoriteButton: PropTypes.bool,
};

const neverRerender = () => true;
export default React.memo(ExchangeCoinRow, neverRerender);
