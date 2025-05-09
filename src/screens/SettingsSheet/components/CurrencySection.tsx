import React, { useCallback } from 'react';
import { Platform, View } from 'react-native';
import { reloadTimelines } from 'react-native-widgetkit';
import Menu from './Menu';
import MenuContainer from './MenuContainer';
import MenuItem from './MenuItem';
import { analytics } from '@/analytics';
import { IS_IOS } from '@/env';
import { useAccountSettings } from '@/hooks';
import { ETH_ADDRESS, WBTC_ADDRESS, emojis, supportedNativeCurrencies } from '@/references';
import { useExternalToken } from '@/resources/assets/externalAssetsQuery';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { ChainId } from '@/state/backendNetworks/types';
import { NativeCurrencyKey } from '@/entities';

const emojiData = Object.entries(emojis).map(([emoji, { name }]) => [name, emoji]);

const emoji = new Map(emojiData as any);

const currencyListItems = Object.values(supportedNativeCurrencies).map(({ currency, ...item }) => ({
  ...item,
  currency,
}));

const CurrencySection = () => {
  const { nativeCurrency, settingsChangeNativeCurrency } = useAccountSettings();
  const { data: WBTC } = useExternalToken({ address: WBTC_ADDRESS, chainId: ChainId.mainnet, currency: nativeCurrency });
  const { data: ETH } = useExternalToken({ address: ETH_ADDRESS, chainId: ChainId.mainnet, currency: nativeCurrency });

  const onSelectCurrency = useCallback(
    (currency: NativeCurrencyKey) => {
      userAssetsStoreManager.setState({ currency });
      settingsChangeNativeCurrency(currency);
      // reload widget timelines only if on ios version 14 or above
      if (IS_IOS && parseInt(Platform.Version as string) >= 14) {
        reloadTimelines('PriceWidget');
      }
      analytics.track(analytics.event.changedNativeCurrency, { currency });
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
                    chainId={ChainId.mainnet}
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
