import React, { useCallback } from 'react';
import { Platform, View } from 'react-native';
import { reloadTimelines } from 'react-native-widgetkit';
import Menu from './Menu';
import MenuContainer from './MenuContainer';
import MenuItem from './MenuItem';
import { analytics } from '@/analytics';
import { useAccountSettings } from '@/hooks';
import { ETH_ADDRESS, WBTC_ADDRESS, emojis, supportedNativeCurrencies } from '@/references';
import { Network } from '@/networks/types';
import { useExternalToken } from '@/resources/assets/externalAssetsQuery';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { useTheme } from '@/theme';

const emojiData = Object.entries(emojis).map(([emoji, { name }]) => [name, emoji]);

const emoji = new Map(emojiData as any);

const currencyListItems = Object.values(supportedNativeCurrencies).map(({ currency, ...item }) => ({
  ...item,
  currency,
}));

const CurrencySection = () => {
  const { nativeCurrency, settingsChangeNativeCurrency } = useAccountSettings();
  const theme = useTheme();
  const { data: WBTC } = useExternalToken({ address: WBTC_ADDRESS, network: Network.mainnet, currency: nativeCurrency });
  const { data: ETH } = useExternalToken({ address: ETH_ADDRESS, network: Network.mainnet, currency: nativeCurrency });

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
                <MenuItem.TextIcon icon={(emoji.get('flag_' + emojiName) as string) || ''} isEmoji />
              ) : (
                <View style={{ marginLeft: 7 }}>
                  <RainbowCoinIcon
                    icon={currency === ETH?.symbol ? ETH?.icon_url : WBTC?.icon_url}
                    size={23}
                    symbol={currency}
                    network={Network.mainnet}
                    theme={theme}
                  />
                </View>
              )
            }
            onPress={() => onSelectCurrency(currency)}
            rightComponent={currency === nativeCurrency && <MenuItem.StatusIcon status="selected" />}
            size={52}
            titleComponent={<MenuItem.Title text={label} />}
          />
        ))}
      </Menu>
    </MenuContainer>
  );
};

export default CurrencySection;
