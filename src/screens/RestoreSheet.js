import { useRoute } from '@react-navigation/native';
import React, { useCallback } from 'react';
import { StatusBar } from 'react-native';
import RestoreIcloudStep from '../components/backup/RestoreIcloudStep';
import RestoreSheetFirstStep from '../components/backup/RestoreSheetFirstStep';
import { Column } from '../components/layout';
import { SlackSheet } from '../components/sheet';
import WalletBackupStepTypes from '@rainbow-me/helpers/walletBackupStepTypes';
import { useDimensions } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';

export default function RestoreSheet() {
  const { goBack, navigate, setParams } = useNavigation();
  const { height: deviceHeight } = useDimensions();
  const {
    params: {
      longFormHeight = 0,
      step = WalletBackupStepTypes.first,
      userData,
    } = {},
  } = useRoute();

  const onIcloudRestore = useCallback(() => {
    setParams({ step: WalletBackupStepTypes.cloud });
  }, [setParams]);

  const onManualRestore = useCallback(() => {
    goBack();
    navigate(Routes.IMPORT_SEED_PHRASE_SHEET_NAVIGATOR);
  }, [goBack, navigate]);

  const onWatchAddress = useCallback(() => {
    goBack();
    navigate(Routes.IMPORT_SEED_PHRASE_SHEET_NAVIGATOR);
  }, [goBack, navigate]);

  return (
    <Column height={deviceHeight + longFormHeight}>
      <StatusBar barStyle="light-content" />
      <SlackSheet contentHeight={longFormHeight} testID="restore-sheet">
        {step === WalletBackupStepTypes.cloud ? (
          <RestoreIcloudStep userData={userData} />
        ) : (
          <RestoreSheetFirstStep
            onIcloudRestore={onIcloudRestore}
            onManualRestore={onManualRestore}
            onWatchAddress={onWatchAddress}
            userData={userData}
          />
        )}
      </SlackSheet>
    </Column>
  );
}
