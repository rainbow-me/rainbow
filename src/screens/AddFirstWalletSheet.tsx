import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BackgroundProvider, globalColors, Inset } from '@/design-system';
import { IS_ANDROID, IS_IOS } from '@/env';
import { HARDWARE_WALLETS, useExperimentalFlag } from '@/config';
import { RainbowWallet } from '@/model/wallet';
import WalletBackupTypes from '@/helpers/walletBackupStepTypes';
import { useNavigation } from '@/navigation';
import { RouteProp, useRoute } from '@react-navigation/native';
import { analytics } from '@/analytics';
import { InteractionManager, View } from 'react-native';
import Routes from '@/navigation/routesNames';
import { AddWalletList } from '@/components/add-wallet/AddWalletList';
import { SlackSheet } from '@/components/sheet';
import { AddWalletItem } from '@/components/add-wallet/AddWalletRow';
import { cloudPlatform } from '@/utils/platform';
import * as i18n from '@/languages';

const HEIGHT_INCREMENT = 132;
const MIN_HEIGHT = 390;
const MIN_ROWS = 2;

const TRANSLATIONS = i18n.l.add_first_wallet;

type RouteParams = {
  AddFirstWalletSheetParams: {
    // setSheetHeight: (height: number) => void;
    userData: { wallets: RainbowWallet[] };
  };
};

export const AddFirstWalletSheet = () => {
  const hardwareWalletsEnabled = useExperimentalFlag(HARDWARE_WALLETS);
  const { goBack, navigate, setParams } = useNavigation();
  const { params: { userData } = {} } = useRoute<
    RouteProp<RouteParams, 'AddFirstWalletSheetParams'>
  >();

  const walletsBackedUp = useMemo(() => {
    let count = 0;
    if (userData?.wallets) {
      Object.values(userData.wallets).forEach(wallet => {
        if (wallet.backedUp && wallet.backupType === WalletBackupTypes.cloud) {
          count += 1;
        }
      });
    }
    return count;
  }, [userData]);

  const onManualRestore = useCallback(() => {
    analytics.track('Tapped "Restore with a secret phrase or private key"');
    navigate(Routes.ADD_WALLET_NAVIGATOR, {
      screen: Routes.IMPORT_SEED_PHRASE_SHEET,
    });
  }, [navigate]);

  const onWatchAddress = useCallback(() => {
    analytics.track('Tapped "Watch an Ethereum Address"');
    InteractionManager.runAfterInteractions(goBack);
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => navigate(Routes.IMPORT_SEED_PHRASE_SHEET), 50);
    });
  }, [goBack, navigate]);

  const onCloudRestore = useCallback(() => {
    analytics.track('Tapped "Restore from cloud"');
    InteractionManager.runAfterInteractions(goBack);
    // TODO: Add cloud restore
    InteractionManager.runAfterInteractions(() => {
      setTimeout(
        () =>
          navigate(Routes.ADD_WALLET_NAVIGATOR, {
            screen: Routes.RESTORE_FROM_CLOUD_SHEET,
          }),
        50
      );
    });
  }, [goBack, navigate]);

  const cloudRestoreEnabled = IS_ANDROID || walletsBackedUp > 0;

  let restoreFromCloudDescription;
  if (IS_IOS) {
    // It is not possible for the user to be on iOS and have
    // no backups at this point, since `cloudRestoreEnabled`
    // would be false in that case.
    if (walletsBackedUp > 1) {
      restoreFromCloudDescription = i18n.t(
        TRANSLATIONS.cloud.description_ios_multiple_wallets,
        {
          walletCount: walletsBackedUp,
        }
      );
    } else {
      restoreFromCloudDescription = i18n.t(
        TRANSLATIONS.cloud.description_ios_one_wallet
      );
    }
  } else {
    restoreFromCloudDescription = i18n.t(
      TRANSLATIONS.cloud.description_android
    );
  }

  const restoreFromCloud: AddWalletItem = {
    title: i18n.t(TRANSLATIONS.cloud.title, { platform: cloudPlatform }),
    description: restoreFromCloudDescription,
    icon: '􀌍',
    onPress: onCloudRestore,
  };

  const restoreFromSeed: AddWalletItem = {
    title: i18n.t(TRANSLATIONS.seed.title),
    description: i18n.t(TRANSLATIONS.seed.description),
    icon: '􀑚',
    iconColor: globalColors.purple60,
    testID: 'restore-with-key-button',
    onPress: onManualRestore,
  };

  const watchAddress: AddWalletItem = {
    title: i18n.t(TRANSLATIONS.watch.title),
    description: i18n.t(TRANSLATIONS.watch.description),
    icon: '􀒒',
    iconColor: globalColors.green60,
    testID: 'watch-address-button',
    onPress: onWatchAddress,
  };

  const importFromHardwareWallet: AddWalletItem = {
    title: i18n.t(TRANSLATIONS.hardware_wallet.title),
    description: i18n.t(TRANSLATIONS.hardware_wallet.description),
    icon: '􀕹',
    iconColor: globalColors.blue60,
    onPress: () => {},
  };

  // useEffect(() => setParams({ sheetHeight }), [setParams, sheetHeight]);

  // const androidHeight = iosHeight + 24;

  return (
    // <BackgroundProvider color="surfaceSecondary">
    //   {({ backgroundColor }) => (
    //     <SlackSheet
    //       contentHeight={sheetHeight}
    //       backgroundColor={backgroundColor}
    //       deferredHeight={IS_ANDROID}
    //       height={IS_ANDROID ? sheetHeight : '100%'}
    //       scrollEnabled={false}
    //       testID="restore-sheet"
    //     >
    // <View onLayout={event => setSheetHeight?.(event.nativeEvent.layout.height)}>
    <Inset top="36px" horizontal="30px (Deprecated)" bottom="80px">
      <AddWalletList
        items={[
          ...(cloudRestoreEnabled ? [restoreFromCloud] : []),
          restoreFromSeed,
          ...(hardwareWalletsEnabled ? [importFromHardwareWallet] : []),
          watchAddress,
        ]}
        totalHorizontalInset={30}
      />
    </Inset>
    // </View>
    //     </SlackSheet>
    //   )}
    // </BackgroundProvider>
  );
};
