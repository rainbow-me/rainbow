import * as i18n from '@/languages';
import React from 'react';
import { Inset, Stack, Text, useForegroundColor } from '@/design-system';
import { SheetActionButton } from '@/components/sheet';
import { Layout } from '@/components/hardware-wallets/Layout';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { TRANSLATIONS } from '@/navigation/PairHardwareWalletNavigator';

export function PairHardwareWalletSuccessSheet() {
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
              {i18n.t(TRANSLATIONS.pair_successful)}
            </Text>
            <Stack space="10px">
              <Text
                align="center"
                color="labelTertiary"
                weight="semibold"
                size="15pt / 135%"
              >
                {i18n.t(TRANSLATIONS.almost_done)}
              </Text>
            </Stack>
          </Stack>
        </Inset>
      }
      footer={
        <Inset horizontal="20px">
          <SheetActionButton
            color={buttonColor}
            label={i18n.t(i18n.l.button.next)}
            lightShadows
            onPress={handleNavigateToSearch}
            size="big"
            weight="heavy"
          />
        </Inset>
      }
    />
  );
}
