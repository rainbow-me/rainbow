import analytics from '@segment/analytics-react-native';
import React, { useCallback } from 'react';
import { Platform } from 'react-native';
import { reloadTimelines } from 'react-native-widgetkit';
import { CoinIcon } from '../coin-icon';
import Menu from './components/Menu';
import MenuContainer from './components/MenuContainer';
import MenuItem from './components/MenuItem';
import { useAccountSettings } from '@rainbow-me/hooks';
import { emojis, supportedNativeCurrencies } from '@rainbow-me/references';

const emojiData = Object.entries(emojis).map(([emoji, { name }]) => [
  name,
  emoji,
]);

const emoji = new Map(emojiData as any);

const currencyListItems = Object.values(supportedNativeCurrencies).map(
  ({ currency, ...item }) => ({
    ...item,
    currency,
  })
);

const CurrencySectionV2 = () => {
  const { nativeCurrency, settingsChangeNativeCurrency } = useAccountSettings();

  const onSelectCurrency = useCallback(
    (currency: any) => {
      settingsChangeNativeCurrency(currency);
      // reload widget timelines only if on ios version 14 or above
      if (ios && parseInt(Platform.Version as string) >= 14) {
        reloadTimelines('PriceWidget');
      }
      analytics.track('Changed native currency', { currency });
    },
    [settingsChangeNativeCurrency]
  );

  return (
    <MenuContainer>
      <Menu>
        {currencyListItems.map(({ label, emojiName, currency }: any) => {
          return (
            <MenuItem
              iconPadding="large"
              key={currency}
              leftComponent={
                emojiName ? (
                  <MenuItem.Title
                    text={(emoji.get('flag_' + emojiName) as string) || ''}
                  />
                ) : (
                  // @ts-ignore missing props
                  <CoinIcon address={currency} size={23} symbol={currency} />
                )
              }
              onPress={() => onSelectCurrency(currency)}
              rightComponent={
                currency === nativeCurrency && (
                  <MenuItem.StatusIcon status="selected" />
                )
              }
              size="medium"
              titleComponent={<MenuItem.Title text={label} />}
            />
          );
        })}
      </Menu>
    </MenuContainer>
  );
};

export default CurrencySectionV2;
