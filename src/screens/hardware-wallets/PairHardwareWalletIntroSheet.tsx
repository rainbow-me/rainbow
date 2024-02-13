import * as i18n from '@/languages';
import React from 'react';
import { Linking } from 'react-native';
import { Inset, Stack, Text } from '@/design-system';
import { Layout } from '@/screens/hardware-wallets/components/Layout';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { ButtonPressAnimation } from '@/components/animations';
import { ActionButton } from '@/screens/hardware-wallets/components/ActionButton';
import { TRANSLATIONS } from '@/screens/hardware-wallets/constants';

export const PairHardwareWalletIntroSheet = () => {
  const { navigate } = useNavigation();

  return (
    <Layout>
      <Inset horizontal="36px">
        <Stack alignHorizontal="center" space="20px">
          <Text align="center" color="label" weight="bold" size="26pt">
            {i18n.t(TRANSLATIONS.pair_your_nano)}
          </Text>
          <Stack space="10px">
            <Text align="center" color="labelTertiary" weight="semibold" size="15pt / 135%">
              {i18n.t(TRANSLATIONS.connect_your_ledger)}
            </Text>
            <ButtonPressAnimation onPress={() => Linking.openURL('https://www.ledger.com')} scaleTo={0.9}>
              <Text align="center" color="blue" weight="semibold" size="15pt / 135%">
                {i18n.t(TRANSLATIONS.learn_more_about_ledger)}
              </Text>
            </ButtonPressAnimation>
          </Stack>
        </Stack>
      </Inset>
      <ActionButton onPress={() => navigate(Routes.PAIR_HARDWARE_WALLET_SEARCH_SHEET)} label={i18n.t(TRANSLATIONS.pair_a_new_ledger)} />
    </Layout>
  );
};
