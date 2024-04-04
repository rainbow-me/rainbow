import { RouteProp, useRoute } from '@react-navigation/native';
import React, { useCallback } from 'react';
import { BackupCloudStep, RestoreCloudStep } from '.';
import WalletBackupStepTypes from '@/helpers/walletBackupStepTypes';
import BackupChooseProviderStep from '@/components/backup/BackupChooseProviderStep';
import { BackgroundProvider } from '@/design-system';
import { SimpleSheet } from '@/components/sheet/SimpleSheet';
import AddWalletToCloudBackupStep from '@/components/backup/AddWalletToCloudBackupStep';
import BackupManuallyStep from './BackupManuallyStep';
import { getHeightForStep } from '@/navigation/config';
import { CloudBackupProvider } from './CloudBackupProvider';

type BackupSheetParams = {
  BackupSheet: {
    longFormHeight?: number;
    missingPassword?: boolean;
    step?: string;
    walletId?: string;
    nativeScreen?: boolean;
  };
};

export default function BackupSheet() {
  const { params: { step = WalletBackupStepTypes.no_provider } = {} } = useRoute<RouteProp<BackupSheetParams, 'BackupSheet'>>();

  const renderStep = useCallback(() => {
    switch (step) {
      case WalletBackupStepTypes.backup_now_to_cloud:
        return <AddWalletToCloudBackupStep />;
      case WalletBackupStepTypes.backup_now_manually:
        return <BackupManuallyStep />;
      case WalletBackupStepTypes.backup_cloud:
        return <BackupCloudStep />;
      case WalletBackupStepTypes.restore_from_backup:
        return <RestoreCloudStep />;
      case WalletBackupStepTypes.no_provider:
      default:
        return <BackupChooseProviderStep />;
    }
  }, [step]);

  return (
    <CloudBackupProvider>
      <BackgroundProvider color="surfaceSecondary">
        {({ backgroundColor }) => (
          <SimpleSheet
            testID="backup-sheet"
            backgroundColor={backgroundColor as string}
            customHeight={getHeightForStep(step)}
            scrollEnabled={false}
          >
            {renderStep()}
          </SimpleSheet>
        )}
      </BackgroundProvider>
    </CloudBackupProvider>
  );
}
