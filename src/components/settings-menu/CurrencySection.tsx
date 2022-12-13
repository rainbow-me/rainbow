import React, { useCallback } from 'react';
import { Platform } from 'react-native';
import { reloadTimelines } from 'react-native-widgetkit';
import { CoinIcon } from '../coin-icon';
import Menu from './components/Menu';
import MenuContainer from './components/MenuContainer';
import MenuItem from './components/MenuItem';
import { analytics } from '@/analytics';
import { useAccountSettings } from '@/hooks';
import { emojis, supportedNativeCurrencies } from '@/references';

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

const CurrencySection = () => {
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
        {currencyListItems.map(({ label, emojiName, currency }: any) => (
          <MenuItem
            key={currency}
            leftComponent={
              emojiName ? (
                <MenuItem.TextIcon
                  icon={(emoji.get('flag_' + emojiName) as string) || ''}
                  isEmoji
                />
              ) : (
                <CoinIcon
                  address={currency}
                  size={23}
                  style={{ marginLeft: 7 }}
                  symbol={currency}
                />
              )
            }
            onPress={() => onSelectCurrency(currency)}
            rightComponent={
              currency === nativeCurrency && (
                <MenuItem.StatusIcon status="selected" />
              )
            }
            size={52}
            titleComponent={<MenuItem.Title text={label} />}
          />
        ))}
      </Menu>
    </MenuContainer>
  );
};

export default CurrencySection;
