import analytics from '@segment/analytics-react-native';
import { isNil } from 'lodash';
import React, { useCallback } from 'react';
import { CoinIcon } from '../coin-icon';
import { RadioList, RadioListItem } from '../radio-list';
import { Emoji } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useAccountSettings } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/references' or its... Remove this comment to see the full error message
import { supportedNativeCurrencies } from '@rainbow-me/references';

const currencyListItems = Object.values(supportedNativeCurrencies).map(
  // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '({ currency, ...item }: { [x: st... Remove this comment to see the full error message
  ({ currency, ...item }) => ({
    ...item,
    currency,
    key: currency,
    value: currency,
  })
);

const renderCurrencyIcon = (currency: any, emojiName: any) => {
  if (!currency) return null;
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  if (!isNil(emojiName)) return <Emoji name={'flag_' + emojiName} />;

  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  return <CoinIcon address={currency} size={23} symbol={currency} />;
};

const CurrencyListItem = ({ currency, emojiName, label, ...item }: any) => (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
      analytics.track('Changed native currency', { currency });
    },
    [settingsChangeNativeCurrency]
  );

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
