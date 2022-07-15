import React, { useCallback } from 'react';
import Menu from './components/Menu';
import MenuContainer from './components/MenuContainer';
import MenuItem from './components/MenuItem';
import { supportedNativeCurrencies } from '@rainbow-me/references';
import { CoinIcon } from '../coin-icon';
import { emojis } from '@rainbow-me/references';
import { useAccountSettings } from '@rainbow-me/hooks';
import { Platform } from 'react-native';
import { reloadTimelines } from 'react-native-widgetkit';
import analytics from '@segment/analytics-react-native';

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
              onPress={() => onSelectCurrency(currency)}
              leftComponent={
                emojiName ? (
                  <MenuItem.EmojiIcon>
                    {(emoji.get('flag_' + emojiName) as string) || ''}
                  </MenuItem.EmojiIcon>
                ) : (
                  // @ts-ignore missing props
                  <CoinIcon address={currency} size={23} symbol={currency} />
                )
              }
              rightComponent={
                currency === nativeCurrency && (
                  <MenuItem.StatusIcon status="selected" />
                )
              }
              titleComponent={<MenuItem.Title text={label} />}
              iconPadding="large"
              size="medium"
            />
          );
        })}
      </Menu>
    </MenuContainer>
  );
};

export default CurrencySectionV2;
