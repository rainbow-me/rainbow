import PropTypes from 'prop-types';
import React, { memo, useState } from 'react';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { css } from 'styled-components/primitives';
import { ButtonPressAnimation } from '../animations';
import BottomRowText from './BottomRowText';
import CoinName from './CoinName';
import CoinRow from './CoinRow';
import CoinRowFavoriteButton from './CoinRowFavoriteButton';

const containerStyles = css`
  padding-left: 15;
  padding-right: 0;
`;

const BottomRow = ({ balance, native, showBalance, symbol }) => {
  let text = symbol;
  if (showBalance && native) {
    text = `${balance.display} ≈ ${native.balance.display}`;
  } else if (showBalance) {
    text = `${balance.display}`;
  }
  return <BottomRowText>{text}</BottomRowText>;
};

const balanceShape = {
  balance: PropTypes.shape({ display: PropTypes.string }),
};

BottomRow.propTypes = {
  ...balanceShape,
  native: PropTypes.shape(balanceShape),
  showBalance: PropTypes.bool,
  symbol: PropTypes.string,
};

const TopRow = ({ name }) => <CoinName>{name}</CoinName>;

TopRow.propTypes = {
  name: PropTypes.string,
};

const ExchangeCoinRow = ({
  item,
  onFavoriteAsset,
  onPress,
  showBalance,
  showFavoriteButton,
  ...props
}) => {
  const [localFavorite, setLocalFavorite] = useState(!!item.favorite);

  return (
    <ButtonPressAnimation
      {...props}
      height={CoinRow.height}
      onPress={() => onPress(item)}
      scaleTo={0.98}
    >
      <CoinRow
        {...item}
        bottomRowRender={BottomRow}
        containerStyles={containerStyles}
        showBalance={showBalance}
        topRowRender={TopRow}
      >
        {showFavoriteButton && (
          <CoinRowFavoriteButton
            isFavorited={localFavorite}
            onPress={() => {
              const newLocalFavorite = !localFavorite;
              setLocalFavorite(newLocalFavorite);
              onFavoriteAsset(item.address, newLocalFavorite);
              ReactNativeHapticFeedback.trigger('selection');
            }}
          />
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

export default memo(ExchangeCoinRow, neverRerender);
