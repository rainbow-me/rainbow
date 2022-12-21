import { AddWalletList } from '@/components/add-wallet/AddWalletList';
import { AddWalletItem } from '@/components/add-wallet/AddWalletRow';
import { SlackSheet } from '@/components/sheet';
import {
  BackgroundProvider,
  Box,
  globalColors,
  Inset,
  Stack,
  Text,
} from '@/design-system';
import { IS_ANDROID } from '@/env';
import { useNavigation } from '@/navigation';
import { deviceUtils } from '@/utils';
import { RouteProp, useRoute } from '@react-navigation/core';
import Routes from '@/navigation/routesNames';
import React from 'react';
import * as i18n from '@/languages';
import { HARDWARE_WALLETS, useExperimentalFlag } from '@/config';

const TRANSLATIONS = i18n.l.wallet.new.add_wallet;

type RouteParams = {
  AddWalletSheetParams: {
    onPressAddAccount: () => void;
  };
};

export const AddWalletSheet = () => {
  const {
    params: { onPressAddAccount },
  } = useRoute<RouteProp<RouteParams, 'AddWalletSheetParams'>>();
  const { navigate } = useNavigation();

  const hardwareWalletsEnabled = useExperimentalFlag(HARDWARE_WALLETS);

  const createNew: AddWalletItem = {
    title: i18n.t(TRANSLATIONS.create_new.title),
    description: i18n.t(TRANSLATIONS.create_new.description),
    icon: '􀁌',
    iconColor: globalColors.pink60,
    onPress: onPressAddAccount,
  };

  const restoreFromSeed: AddWalletItem = {
    title: i18n.t(TRANSLATIONS.seed.title),
    description: i18n.t(TRANSLATIONS.seed.description),
    icon: '􀑚',
    iconColor: globalColors.purple60,
    testID: 'restore-with-key-button',
    onPress: () =>
      navigate(Routes.ADD_WALLET_NAVIGATOR, {
        screen: Routes.IMPORT_SEED_PHRASE_FLOW,
        params: { type: 'import' },
      }),
  };

  const watchAddress: AddWalletItem = {
    title: i18n.t(TRANSLATIONS.watch.title),
    description: i18n.t(TRANSLATIONS.watch.description),
    icon: '􀒒',
    iconColor: globalColors.green60,
    testID: 'watch-address-button',
    onPress: () =>
      navigate(Routes.ADD_WALLET_NAVIGATOR, {
        screen: Routes.IMPORT_SEED_PHRASE_FLOW,
        params: { type: 'watch' },
      }),
  };

  const connectHardwareWallet: AddWalletItem = {
    title: i18n.t(TRANSLATIONS.hardware_wallet.title),
    description: i18n.t(TRANSLATIONS.hardware_wallet.description),
    icon: '􀕹',
    iconColor: globalColors.blue60,
    onPress: () => {},
  };

  return (
    <BackgroundProvider color="surfaceSecondary">
      {({ backgroundColor }) => (
        // @ts-expect-error js component
        <SlackSheet
          contentHeight={deviceUtils.dimensions.height}
          backgroundColor={backgroundColor}
          height={IS_ANDROID ? deviceUtils.dimensions.height : '100%'}
          deferredHeight={IS_ANDROID}
          scrollEnabled={false}
          // testID="restore-sheet"
        >
          <Inset horizontal="20px" top="36px">
            <Stack space="32px">
              <Stack space="20px">
                <Text align="center" size="26pt" weight="bold" color="label">
                  {i18n.t(TRANSLATIONS.sheet.title)}
                </Text>
                <Text
                  align="center"
                  size="15pt / 135%"
                  weight="semibold"
                  color="labelTertiary"
                >
                  {i18n.t(TRANSLATIONS.sheet.description)}
                </Text>
              </Stack>
              <Box background="surfacePrimary" borderRadius={18} shadow="12px">
                <Inset vertical="24px" horizontal="20px">
                  <AddWalletList
                    totalHorizontalInset={40}
                    items={[
                      createNew,
                      ...(hardwareWalletsEnabled
                        ? [connectHardwareWallet]
                        : []),
                      watchAddress,
                      restoreFromSeed,
                    ]}
                  />
                </Inset>
              </Box>
            </Stack>
          </Inset>
        </SlackSheet>
      )}
    </BackgroundProvider>
  );
};
