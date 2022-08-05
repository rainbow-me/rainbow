import { isNil } from 'lodash';
import React, { useCallback } from 'react';
import { Platform } from 'react-native';
import { reloadTimelines } from 'react-native-widgetkit';
import { CoinIcon } from '../coin-icon';
import { RadioList, RadioListItem } from '../radio-list';
import { Emoji } from '../text';
import { analytics } from '@rainbow-me/analytics';
import { useAccountSettings } from '@rainbow-me/hooks';
import { supportedNativeCurrencies } from '@rainbow-me/references';

const currencyListItems = Object.values(supportedNativeCurrencies).map(
  ({ currency, ...item }) => ({
    ...item,
    currency,
    key: currency,
    value: currency,
  })
);

const renderCurrencyIcon = (currency, emojiName) => {
  if (!currency) return null;
  if (!isNil(emojiName)) return <Emoji name={'flag_' + emojiName} />;

  return <CoinIcon address={currency} size={23} symbol={currency} />;
};

const CurrencyListItem = ({ currency, emojiName, label, ...item }) => (
  <RadioListItem
    {...item}
    icon={renderCurrencyIcon(currency, emojiName)}
    label={`${label}`}
    value={currency}
  />
);

const CurrencySection = () => {
  const { nativeCurrency, settingsChangeNativeCurrency } = useAccountSettings();

  const onSelectCurrency = useCallback(
    currency => {
      settingsChangeNativeCurrency(currency);
      // reload widget timelines only if on ios version 14 or above
      if (ios && parseInt(Platform.Version) >= 14) {
        reloadTimelines('PriceWidget');
      }
      analytics.track('Changed native currency', { currency });
    },
    [settingsChangeNativeCurrency]
  );

  return (
    <RadioList
      extraData={nativeCurrency}
      items={currencyListItems}
      marginTop={7}
      onChange={onSelectCurrency}
      renderItem={CurrencyListItem}
      value={nativeCurrency}
    />
  );
};

export default CurrencySection;
