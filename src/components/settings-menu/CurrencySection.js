import { omit } from 'lodash';
import PropTypes from 'prop-types';
import { supportedNativeCurrencies } from '@rainbow-me/rainbow-common';
import React from 'react';
import { compose, onlyUpdateForKeys, withHandlers } from 'recompact';
import { withAccountSettings } from '../../hoc';
import { CoinIcon } from '../coin-icon';
import { RadioList, RadioListItem } from '../radio-list';
import { Emoji } from '../text';

// Disable BTC native currency support until BTC wallet support exists
const currencies = omit(supportedNativeCurrencies || {}, 'BTC');
const currencyListItems = Object.values(currencies).map(({ currency, ...item }) => ({
  ...item,
  currency,
  key: currency,
  value: currency,
}));

const renderCurrencyIcon = (currency) => {
  if (!currency) return null;

  if (currency === 'EUR') return <Emoji name="flag-eu" />;
  if (currency === 'GBP') return <Emoji name="gb" />;
  if (currency === 'USD') return <Emoji name="us" />;

  return (
    <CoinIcon
      showShadow={false}
      size={23}
      symbol={currency}
    />
  );
};

// eslint-disable-next-line react/prop-types
const renderCurrencyListItem = ({ currency, label, ...item }) => (
  <RadioListItem
    {...item}
    icon={renderCurrencyIcon(currency)}
    label={`${label} (${currency})`}
    value={currency}
  />
);

const CurrencySection = ({ nativeCurrency, onSelectCurrency }) => (
  <RadioList
    extraData={nativeCurrency}
    items={currencyListItems}
    onChange={onSelectCurrency}
    renderItem={renderCurrencyListItem}
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
    onSelectCurrency: ({ settingsChangeNativeCurrency }) => (currency) => settingsChangeNativeCurrency(currency),
  }),
  onlyUpdateForKeys(['nativeCurrency']),
)(CurrencySection);
