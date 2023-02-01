import * as i18n from '@/languages';
import React from 'react';
import { Inset, Stack, Text } from '@/design-system';
import { Layout } from '@/screens/hardware-wallets/components/Layout';
import { CancelButton } from '@/screens/hardware-wallets/components/CancelButton';
import { TRANSLATIONS } from '@/screens/hardware-wallets/constants';
import { useSetRecoilState } from 'recoil';
import { useLedgerImport } from '@/hooks/useLedgerImport';
import Routes from '@/navigation/routesNames';
import { useNavigation } from '@/navigation';
import { LedgerImportDeviceIdAtom } from '@/utils/ledger';
import { LedgerImportReadyForPollingAtom } from '@/navigation/PairHardwareWalletNavigator';

export const PairHardwareWalletSearchSheet = () => {
  const { navigate } = useNavigation();
  const setDeviceId = useSetRecoilState(LedgerImportDeviceIdAtom);
  const setReadyForPolling = useSetRecoilState(LedgerImportReadyForPollingAtom);
  const { pairingStatus } = useLedgerImport({
    successCallback: deviceId => {
      setDeviceId(deviceId);
      navigate(Routes.PAIR_HARDWARE_WALLET_SUCCESS_SHEET);
      // wait to start polling for useLedgerConnect
      setTimeout(() => {
        setReadyForPolling(true);
      }, 2000);
    },
  });

  return (
    <Layout>
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
      <CancelButton />
    </Layout>
  );
};
