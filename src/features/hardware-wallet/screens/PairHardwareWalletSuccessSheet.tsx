import React from 'react';

import { CheckmarkAnimation } from '@/components/animations/CheckmarkAnimation';
import { Box, Inset, Stack, Text } from '@/design-system';
import * as i18n from '@/languages';
import { useNavigation } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';

import { ActionButton } from '../components/ActionButton';
import { Layout } from '../components/Layout';
import { TRANSLATIONS } from './constants';

export const PairHardwareWalletSuccessSheet = () => {
  const { navigate } = useNavigation();

  return (
    <Layout>
      <Inset horizontal="36px">
        <Stack alignHorizontal="center" space="20px">
          <Text align="center" color="label" weight="bold" size="26pt">
            {i18n.t(TRANSLATIONS.device_connected)}
          </Text>
          <Stack space="10px">
            <Text align="center" color="labelTertiary" weight="semibold" size="15pt / 135%">
              {i18n.t(TRANSLATIONS.almost_done)}
            </Text>
          </Stack>
        </Stack>
      </Inset>
      <Box paddingBottom="36px">
        <CheckmarkAnimation />
      </Box>
      <ActionButton label={i18n.t(i18n.l.button.next)} onPress={() => navigate(Routes.PAIR_HARDWARE_WALLET_SIGNING_SHEET)} />
    </Layout>
  );
};
