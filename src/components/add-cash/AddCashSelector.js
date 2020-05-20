import { toLower, upperFirst } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { colors } from '../../styles';
import { CoinIcon } from '../coin-icon';
import { JellySelector } from '../jelly-selector';
import { RowWithMargins } from '../layout';
import { Text } from '../text';

const CurrencyItemHeight = 40;

const CurrencyItem = isWalletEthZero => ({ item, isSelected }) => {
  const label = item === 'ETH' ? 'Ethereum' : item;

  return (
    <RowWithMargins
      align="center"
      height={CurrencyItemHeight}
      margin={6}
      paddingLeft={7}
      paddingRight={11}
      opacity={isWalletEthZero && item !== 'ETH' ? 0.5 : 1}
    >
      <CoinIcon size={26} symbol={item} />
      <Text
        color={colors.alpha(colors.blueGreyDark, isSelected ? 0.8 : 0.6)}
        letterSpacing="roundedMedium"
        size="larger"
        style={{ paddingBottom: 1.5 }}
        weight="semibold"
      >
        {upperFirst(toLower(label))}
      </Text>
    </RowWithMargins>
  );
};

const AddCashSelector = ({
  currencies,
  initialCurrencyIndex,
  isWalletEthZero,
  onSelect,
}) => (
  <JellySelector
    disableSelection={isWalletEthZero}
    height={CurrencyItemHeight}
    initialCurrencyIndex={initialCurrencyIndex}
    items={currencies}
    onSelect={onSelect}
    renderItem={CurrencyItem(isWalletEthZero)}
  />
);

AddCashSelector.propTypes = {
  currencies: PropTypes.array,
  initialCurrencyIndex: PropTypes.number,
  onSelect: PropTypes.func,
};

const neverRerender = () => true;
export default React.memo(AddCashSelector, neverRerender);
