import * as i18n from '@/languages';
import React, { useState } from 'react';
import { Box, Inset, Stack, Text } from '@/design-system';
import { Layout } from '@/screens/hardware-wallets/components/Layout';
import { TRANSLATIONS } from '@/screens/hardware-wallets/constants';
import { useSetRecoilState } from 'recoil';
import { useLedgerImport } from '@/hooks/useLedgerImport';
import Routes from '@/navigation/routesNames';
import { useNavigation } from '@/navigation';
import {
  LedgerImportDeviceIdAtom,
  LedgerImportReadyForPollingAtom,
} from '@/navigation/PairHardwareWalletNavigator';
import { ActionButton } from '@/screens/hardware-wallets/components/ActionButton';

export const PairHardwareWalletSearchSheet = () => {
  const { navigate } = useNavigation();
  const setDeviceId = useSetRecoilState(LedgerImportDeviceIdAtom);
  const setReadyForPolling = useSetRecoilState(LedgerImportReadyForPollingAtom);
  const [isConnected, setIsConnected] = useState(false);
  useLedgerImport({
    successCallback: deviceId => {
      setDeviceId(deviceId);
      setIsConnected(true);
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
            {isConnected
              ? i18n.t(TRANSLATIONS.device_connected)
              : i18n.t(TRANSLATIONS.looking_for_devices)}
          </Text>
          <Text
            align="center"
            color="labelTertiary"
            weight="semibold"
            size="15pt / 135%"
          >
            {isConnected
              ? i18n.t(TRANSLATIONS.almost_done)
              : i18n.t(TRANSLATIONS.make_sure_bluetooth_enabled)}
          </Text>
        </Stack>
      </Inset>
      {isConnected && (
        <ActionButton
          label={i18n.t(i18n.l.button.next)}
          onPress={() => navigate(Routes.PAIR_HARDWARE_WALLET_SIGNING_SHEET)}
        />
      )}
    </Layout>
  );
};
