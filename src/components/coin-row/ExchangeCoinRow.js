import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { css } from 'styled-components/primitives';
import { haptics } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { CoinIcon } from '../coin-icon';
import { Centered, ColumnWithMargins } from '../layout';
import BalanceText from './BalanceText';
import BottomRowText from './BottomRowText';
import CoinName from './CoinName';
import CoinRow from './CoinRow';
import CoinRowFavoriteButton from './CoinRowFavoriteButton';

const containerStyles = css`
  padding-left: 15;
  padding-right: 0;
`;

const BottomRow = ({ showBalance, symbol }) =>
  showBalance ? null : <BottomRowText>{symbol}</BottomRowText>;

BottomRow.propTypes = {
  showBalance: PropTypes.bool,
  symbol: PropTypes.string,
};

const TopRow = ({ name, showBalance }) => (
  <Centered height={showBalance ? CoinIcon.size : null}>
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
  const [localFavorite, setLocalFavorite] = useState(!!item.favorite);

  return (
    <ButtonPressAnimation
      {...props}
      height={CoinRow.height}
      onPress={() => onPress(item)}
      scaleTo={0.96}
    >
      <CoinRow
        {...item}
        bottomRowRender={BottomRow}
        containerStyles={containerStyles}
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
          <CoinRowFavoriteButton
            isFavorited={localFavorite}
            onPress={() => {
              const newLocalFavorite = !localFavorite;
              setLocalFavorite(newLocalFavorite);
              onFavoriteAsset(item.address, newLocalFavorite);
              haptics.selection();
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
export default React.memo(ExchangeCoinRow, neverRerender);
