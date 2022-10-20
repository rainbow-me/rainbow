import lang from 'i18n-js';
import React from 'react';
import { Linking } from 'react-native';
import { Inset, Stack, Text, useForegroundColor } from '@/design-system';
import { SheetActionButton } from '@/components/sheet';
import { ImgixImage } from '@/components/images';
import ledgerNano from '@/assets/ledger-nano.png';
import { Source } from 'react-native-fast-image';
import { Layout } from '@/components/hardware-wallets/Layout';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { ButtonPressAnimation } from '@/components/animations';

export function PairHardwareWalletIntroSheet() {
  const buttonColor = useForegroundColor('purple');

  const { navigate } = useNavigation();
  const handleNavigateToSearch = React.useCallback(() => {
    navigate(Routes.PAIR_HARDWARE_WALLET_SEARCH_SHEET);
  }, [navigate]);

  return (
    <Layout
      header={
        <Inset horizontal="36px">
          <Stack alignHorizontal="center" space="20px">
            <Text align="center" color="label" weight="bold" size="26pt">
              {lang.t('hardware_wallets.pair_your_nano')}
            </Text>
            <Stack space="10px">
              <Text
                align="center"
                color="labelTertiary"
                weight="semibold"
                size="15pt / 135%"
              >
                {lang.t('hardware_wallets.connect_your_ledger')}
              </Text>
              <ButtonPressAnimation
                onPress={() => Linking.openURL('https://www.ledger.com')}
                scaleTo={0.9}
              >
                <Text
                  align="center"
                  color="blue"
                  weight="semibold"
                  size="15pt / 135%"
                >
                  {lang.t('hardware_wallets.learn_more_about_ledger')}
                </Text>
              </ButtonPressAnimation>
            </Stack>
          </Stack>
        </Inset>
      }
      footer={
        <Inset horizontal="20px">
          <SheetActionButton
            color={buttonColor}
            // @ts-expect-error JavaScript component
            label={lang.t('hardware_wallets.pair_a_new_ledger')}
            lightShadows
            onPress={handleNavigateToSearch}
            // @ts-expect-error - JS component
            size="big"
            weight="heavy"
          />
        </Inset>
      }
    >
      <Inset top="52px">
        <ImgixImage
          source={ledgerNano as Source}
          style={{ width: 216, height: 292 }}
          size={292}
        />
      </Inset>
    </Layout>
  );
}
