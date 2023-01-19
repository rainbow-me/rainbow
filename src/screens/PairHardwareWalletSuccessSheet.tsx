import * as i18n from '@/languages';
import React from 'react';
import { Box, Inset, Stack, Text } from '@/design-system';
import { Layout } from '@/components/hardware-wallets/Layout';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { TRANSLATIONS } from '@/navigation/PairHardwareWalletNavigator';
import {
  CheckmarkAnimation,
  CHECKMARK_SIZE,
} from '@/components/animations/CheckmarkAnimation';
import { useDimensions } from '@/hooks';
import { ActionButton } from '@/components/hardware-wallets/ActionButton';

export const PairHardwareWalletSuccessSheet = () => {
  const { height: deviceHeight } = useDimensions();
  const { navigate } = useNavigation();

  return (
    <Box height="full" width="full">
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
            <ActionButton
              label={i18n.t(i18n.l.button.next)}
              onPress={() =>
                navigate(Routes.PAIR_HARDWARE_WALLET_SIGNING_SHEET)
              }
            />
          </Inset>
        }
      />
      <Box
        width="full"
        position="absolute"
        top={{ custom: (deviceHeight - CHECKMARK_SIZE) / 2 }}
      >
        <CheckmarkAnimation />
      </Box>
    </Box>
  );
};
