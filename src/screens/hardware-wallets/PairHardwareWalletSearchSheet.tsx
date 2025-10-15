import i18n from '@/languages';
import React from 'react';
import { Box, Inset, Stack, Text } from '@/design-system';
import { Layout } from '@/screens/hardware-wallets/components/Layout';
import { TRANSLATIONS } from '@/screens/hardware-wallets/constants';
import { useSetRecoilState } from 'recoil';
import { useLedgerImport } from '@/hooks/useLedgerImport';
import Routes from '@/navigation/routesNames';
import { useNavigation } from '@/navigation';
import { LedgerImportDeviceIdAtom } from '@/navigation/PairHardwareWalletNavigator';
import { ActionButton } from '@/screens/hardware-wallets/components/ActionButton';
import { CancelButton } from './components/CancelButton';

export const PairHardwareWalletSearchSheet = () => {
  const { navigate, goBack } = useNavigation();
  const setDeviceId = useSetRecoilState(LedgerImportDeviceIdAtom);
  const [isConnected, setIsConnected] = React.useState(false);

  useLedgerImport({
    successCallback: deviceId => {
      setDeviceId(deviceId);
      setIsConnected(true);
    },
  });

  return (
    <Layout>
      <Inset horizontal="36px">
        <Stack alignHorizontal="center" space="20px">
          <Text align="center" color="label" weight="bold" size="26pt">
            {isConnected ? TRANSLATIONS.device_connected() : TRANSLATIONS.looking_for_devices()}
          </Text>
          <Text align="center" color="labelTertiary" weight="semibold" size="15pt / 135%">
            {isConnected ? TRANSLATIONS.almost_done() : TRANSLATIONS.make_sure_bluetooth_enabled()}
          </Text>
        </Stack>
      </Inset>
      <Box width="full">
        <Stack space="16px">
          {isConnected && <ActionButton label={i18n.button.next()} onPress={() => navigate(Routes.PAIR_HARDWARE_WALLET_SIGNING_SHEET)} />}
          <CancelButton onPress={goBack} />
        </Stack>
      </Box>
    </Layout>
  );
};
