import { toLower, upperFirst } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/primitives';
import { colors } from '../../styles';
import { CoinIcon } from '../coin-icon';
import { JellySelector, JellySelectorShadowIndicator } from '../jelly-selector';
import { RowWithMargins } from '../layout';
import { Text } from '../text';

const CurrencyItemHeight = 40;

const CurrencyItemLabel = styled(Text).attrs({
  color: colors.blueGreyDark,
  letterSpacing: 'roundedMedium',
  size: 'larger',
  weight: 'semibold',
})`
  opacity: ${({ isSelected }) => (isSelected ? 0.8 : 0.6)};
  padding-bottom: 1.5;
`;

const CurrencyItem = isWalletEthZero => ({ item, isSelected }) => {
  const label = item === 'ETH' ? 'Ethereum' : item;

  return (
    <RowWithMargins
      align="center"
      height={CurrencyItemHeight}
      margin={6}
      opacity={isWalletEthZero && item !== 'ETH' ? 0.5 : 1}
      paddingLeft={7}
      paddingRight={11}
    >
      <CoinIcon size={26} symbol={item} />
      <CurrencyItemLabel isSelected={isSelected}>
        {upperFirst(toLower(label))}
      </CurrencyItemLabel>
    </RowWithMargins>
  );
};

const CurrencyItemRow = props => (
  <RowWithMargins justify="center" margin={8} maxWidth={300} {...props} />
);

const AddCashSelector = ({
  currencies,
  initialCurrencyIndex,
  isWalletEthZero,
  onSelect,
}) => (
  <JellySelector
    defaultIndex={initialCurrencyIndex}
    disableSelection={isWalletEthZero}
    height={CurrencyItemHeight}
    items={currencies}
    onSelect={onSelect}
    renderIndicator={JellySelectorShadowIndicator}
    renderItem={CurrencyItem(isWalletEthZero)}
    renderRow={CurrencyItemRow}
  />
);

AddCashSelector.propTypes = {
  currencies: PropTypes.array,
  initialCurrencyIndex: PropTypes.number,
  onSelect: PropTypes.func,
};

const neverRerender = () => true;
export default React.memo(AddCashSelector, neverRerender);
