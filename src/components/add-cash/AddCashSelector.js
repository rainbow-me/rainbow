import { toLower, upperFirst } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { colors } from '../../styles';
import { CoinIcon } from '../coin-icon';
import { RowWithMargins } from '../layout';
import { Text } from '../text';
import { JellySelector } from '../jelly-selector';

const CurrencyItemHeight = 40;

const CurrencyItem = ({ item, isSelected }) => {
  const label = item === 'ETH' ? 'Ethereum' : item;
  return (
    <RowWithMargins
      align="center"
      height={CurrencyItemHeight}
      margin={6}
      paddingLeft={7}
      paddingRight={11}
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

const AddCashSelector = ({ currencies, initialCurrencyIndex, onSelect }) => (
  <JellySelector
    height={CurrencyItemHeight}
    initialCurrencyIndex={initialCurrencyIndex}
    items={currencies}
    onSelect={onSelect}
    renderItem={CurrencyItem}
  />
);

AddCashSelector.propTypes = {
  currencies: PropTypes.array,
  initialCurrencyIndex: PropTypes.number,
  onSelect: PropTypes.func,
};

const neverRerender = () => true;
export default React.memo(AddCashSelector, neverRerender);
