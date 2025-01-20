import { AddWalletList } from '@/components/add-wallet/AddWalletList';
import { AddWalletItem } from '@/components/add-wallet/AddWalletRow';
import { Box, globalColors, Inset } from '@/design-system';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import React from 'react';
import * as i18n from '@/languages';
import { HARDWARE_WALLETS, useExperimentalFlag } from '@/config';
import { analytics, analyticsV2 } from '@/analytics';
import { InteractionManager } from 'react-native';
import { logger, RainbowError } from '@/logger';
import WalletsAndBackup from '@/assets/WalletsAndBackup.png';
import CreateNewWallet from '@/assets/CreateNewWallet.png';
import PairHairwareWallet from '@/assets/PairHardwareWallet.png';
import ImportSecretPhraseOrPrivateKey from '@/assets/ImportSecretPhraseOrPrivateKey.png';
import WatchWalletIcon from '@/assets/watchWallet.png';
import { cloudPlatform } from '@/utils/platform';
import { RouteProp, useRoute } from '@react-navigation/native';
import { executeFnIfCloudBackupAvailable } from '@/model/backup';

const TRANSLATIONS = i18n.l.wallet.new.add_wallet_sheet;

export type AddWalletSheetParams = {
  isFirstWallet: boolean;
};

type RouteParams = {
  AddWalletSheetParams: AddWalletSheetParams;
};

export const AddWalletSheet = () => {
  const {
    params: { isFirstWallet },
  } = useRoute<RouteProp<RouteParams, 'AddWalletSheetParams'>>();

  const { goBack, navigate } = useNavigation();

  const hardwareWalletsEnabled = useExperimentalFlag(HARDWARE_WALLETS);

  const onPressCreate = async () => {
    try {
      analyticsV2.track(analyticsV2.event.addWalletFlowStarted, {
        isFirstWallet,
        type: 'new',
      });
      analytics.track('Tapped "Create a new wallet"');

      navigate(Routes.CHOOSE_WALLET_GROUP, {});
    } catch (e) {
      logger.error(new RainbowError('[AddWalletSheet]: Error while trying to add account'), {
        error: e,
      });
    }
  };

  const onPressRestoreFromSeed = () => {
    analytics.track('Tapped "Add an existing wallet"');
    analyticsV2.track(analyticsV2.event.addWalletFlowStarted, {
      isFirstWallet,
      type: 'seed',
    });
    navigate(Routes.ADD_WALLET_NAVIGATOR, {
      screen: Routes.IMPORT_OR_WATCH_WALLET_SHEET,
      params: { type: 'import', isFirstWallet },
    });
  };

  const onPressWatch = () => {
    analytics.track('Tapped "Watch an Ethereum Address"');
    analyticsV2.track(analyticsV2.event.addWalletFlowStarted, {
      isFirstWallet,
      type: 'watch',
    });
    navigate(Routes.ADD_WALLET_NAVIGATOR, {
      screen: Routes.IMPORT_OR_WATCH_WALLET_SHEET,
      params: { type: 'watch', isFirstWallet },
    });
  };

  const onPressRestoreFromCloud = async () => {
    analyticsV2.track(analyticsV2.event.addWalletFlowStarted, {
      isFirstWallet,
      type: 'seed',
    });

    executeFnIfCloudBackupAvailable({
      fn: () => navigate(Routes.RESTORE_SHEET),
      logout: true,
    });
  };

  const restoreFromCloudDescription = i18n.t(TRANSLATIONS.options.cloud.description_restore_sheet, {
    cloudPlatform,
  });

  const onPressConnectHardwareWallet = () => {
    analyticsV2.track(analyticsV2.event.addWalletFlowStarted, {
      isFirstWallet: false,
      type: 'ledger_nano_x',
    });
    goBack();
    InteractionManager.runAfterInteractions(() => {
      navigate(Routes.PAIR_HARDWARE_WALLET_NAVIGATOR, {
        entryPoint: Routes.ADD_WALLET_SHEET,
        isFirstWallet,
      });
    });
  };

  const create: AddWalletItem = {
    title: i18n.t(TRANSLATIONS.options.create_new.title),
    description: i18n.t(TRANSLATIONS.options.create_new.description),
    icon: CreateNewWallet,
    iconColor: globalColors.pink60,
    testID: 'create-new-button',
    onPress: onPressCreate,
  };

  const restoreFromCloud: AddWalletItem = {
    title: i18n.t(TRANSLATIONS.options.cloud.title, {
      platform: cloudPlatform,
    }),
    description: restoreFromCloudDescription,
    descriptionColor: 'blue',
    icon: WalletsAndBackup,
    onPress: onPressRestoreFromCloud,
  };

  const restoreFromSeed: AddWalletItem = {
    title: i18n.t(TRANSLATIONS.options.seed.title),
    description: i18n.t(TRANSLATIONS.options.seed.description),
    icon: ImportSecretPhraseOrPrivateKey,
    testID: 'restore-with-key-button',
    onPress: onPressRestoreFromSeed,
  };

  const watch: AddWalletItem = {
    title: i18n.t(TRANSLATIONS.options.watch.title),
    description: i18n.t(TRANSLATIONS.options.watch.description),
    icon: WatchWalletIcon,
    testID: 'watch-address-button',
    onPress: onPressWatch,
  };

  const connectHardwareWallet: AddWalletItem = {
    title: i18n.t(TRANSLATIONS.options.hardware_wallet.title),
    description: i18n.t(TRANSLATIONS.options.hardware_wallet.description),
    icon: PairHairwareWallet,
    iconColor: globalColors.blue60,
    testID: 'connect-hardware-wallet-button',
    onPress: onPressConnectHardwareWallet,
  };

  return (
    <Box height="full" width="full" background="surfaceSecondary" testID="add-wallet-sheet">
      <Inset horizontal="28px" top="36px">
        <AddWalletList
          totalHorizontalInset={24}
          items={[
            ...(!isFirstWallet ? [create] : []),
            ...(isFirstWallet ? [restoreFromCloud] : []),
            restoreFromSeed,
            ...(hardwareWalletsEnabled ? [connectHardwareWallet] : []),
            watch,
          ]}
        />
      </Inset>
    </Box>
  );
};
