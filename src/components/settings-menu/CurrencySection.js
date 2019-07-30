import analytics from '@segment/analytics-react-native';
import { isNil } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { compose, onlyUpdateForKeys, withHandlers } from 'recompact';
import { withAccountSettings } from '../../hoc';
import { CoinIcon } from '../coin-icon';
import { RadioList, RadioListItem } from '../radio-list';
import supportedNativeCurrencies from '../../references/native-currencies.json';
import { Emoji } from '../text';

const currencyListItems = Object.values(supportedNativeCurrencies).map(({ currency, ...item }) => ({
  ...item,
  currency,
  key: currency,
  value: currency,
}));

const renderCurrencyIcon = (currency, emojiName) => {
  if (!currency) return null;
  if (!isNil(emojiName)) return <Emoji name={emojiName} />;

  return (
    <CoinIcon
      showShadow={false}
      size={23}
      symbol={currency}
    />
  );
};

const CurrencyListItem = ({
  currency,
  emojiName,
  label,
  ...item
}) => (
  <RadioListItem
    {...item}
    icon={renderCurrencyIcon(currency, emojiName)}
    label={`${label} (${currency})`}
    value={currency}
  />
);

CurrencyListItem.propTypes = {
  currency: PropTypes.string,
  emojiName: PropTypes.string,
  label: PropTypes.string,
};

const CurrencySection = ({ nativeCurrency, onSelectCurrency }) => (
  <RadioList
    extraData={nativeCurrency}
    items={currencyListItems}
    onChange={onSelectCurrency}
    renderItem={CurrencyListItem}
    value={nativeCurrency}
  />
);

CurrencySection.propTypes = {
  nativeCurrency: PropTypes.oneOf(Object.keys(supportedNativeCurrencies)),
  onSelectCurrency: PropTypes.func.isRequired,
};

export default compose(
  withAccountSettings,
  withHandlers({
    onSelectCurrency: ({ settingsChangeNativeCurrency }) => (currency) => {
      settingsChangeNativeCurrency(currency);
      analytics.track('Changed native currency', { currency });
    },
  }),
  onlyUpdateForKeys(['nativeCurrency']),
)(CurrencySection);
