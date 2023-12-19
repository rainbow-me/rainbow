import React, { useCallback } from 'react';
import { Platform } from 'react-native';
import { reloadTimelines } from 'react-native-widgetkit';
import { CoinIcon } from '../../../components/coin-icon';
import Menu from './Menu';
import MenuContainer from './MenuContainer';
import MenuItem from './MenuItem';
import { analytics } from '@/analytics';
import { useAccountSettings } from '@/hooks';
import { emojis, supportedNativeCurrencies } from '@/references';
import { BackgroundProvider, Box, Inline, Inset, Text } from '@/design-system';
import { useNavigation } from '@/navigation';
import { SimpleSheet } from '@/components/sheet/SimpleSheet';
import * as i18n from '@/languages';

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
  const { goBack } = useNavigation();

  const onSelectCurrency = useCallback(
    (currency: any) => {
      settingsChangeNativeCurrency(currency);
      // reload widget timelines only if on ios version 14 or above
      if (ios && parseInt(Platform.Version as string) >= 14) {
        reloadTimelines('PriceWidget');
      }
      analytics.track(analytics.event.currencyChanged, { currency });
    },
    [settingsChangeNativeCurrency]
  );

  return (
    <BackgroundProvider color="surfaceSecondary">
      {({ backgroundColor }) => (
        <SimpleSheet backgroundColor={backgroundColor as string}>
          <Inset top="20px" horizontal="20px" bottom="60px">
            <Inline alignHorizontal="center" alignVertical="center">
              <Box paddingBottom="12px">
                <Text size="22pt" weight="heavy" color="label">
                  {i18n.t(i18n.l.settings.currency)}
                </Text>
              </Box>
            </Inline>
            <MenuContainer>
              <Menu>
                {currencyListItems.map(
                  ({ label, emojiName, currency }: any) => (
                    <MenuItem
                      key={currency}
                      leftComponent={
                        emojiName ? (
                          <MenuItem.TextIcon
                            icon={
                              (emoji.get('flag_' + emojiName) as string) || ''
                            }
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
                  )
                )}
              </Menu>
            </MenuContainer>
          </Inset>
        </SimpleSheet>
      )}
    </BackgroundProvider>
  );
};

export default CurrencySection;
