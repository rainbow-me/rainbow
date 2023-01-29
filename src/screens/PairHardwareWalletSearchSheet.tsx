import * as i18n from '@/languages';
import React from 'react';
import { Inset, Stack, Text } from '@/design-system';
import { Layout } from '@/components/hardware-wallets/Layout';
import TintButton from '@/components/buttons/TintButton';
import { useNavigation } from '@/navigation';
import {
  LedgerImportDeviceIdAtom,
  TRANSLATIONS,
} from '@/navigation/PairHardwareWalletNavigator';
import { useSetRecoilState } from 'recoil';
import { useLedgerImport } from '@/hooks/useLedgerImport';
import Routes from '@/navigation/routesNames';

export function PairHardwareWalletSearchSheet() {
  const { dangerouslyGetParent, navigate } = useNavigation();
  const setDeviceId = useSetRecoilState(LedgerImportDeviceIdAtom);

  const { pairingStatus } = useLedgerImport({
    successCallback: (deviceId: string) => {
      setDeviceId(deviceId);
      navigate(Routes.PAIR_HARDWARE_WALLET_SUCCESS_SHEET);
    },
  });

  return (
    <Layout
      header={
        <Inset horizontal="36px">
          <Stack alignHorizontal="center" space="20px">
            <Text align="center" color="label" weight="bold" size="26pt">
              {i18n.t(TRANSLATIONS.looking_for_devices)}
            </Text>
            <Text
              align="center"
              color="labelTertiary"
              weight="semibold"
              size="15pt / 135%"
            >
              {i18n.t(TRANSLATIONS.make_sure_bluetooth_enabled)}
            </Text>
          </Stack>
        </Inset>
      }
      footer={
        <Inset horizontal="20px">
          <TintButton onPress={() => dangerouslyGetParent()?.goBack()}>
            {i18n.t(i18n.l.button.cancel)}
          </TintButton>
        </Inset>
      }
    />
  );
}
