import { RouteProp, useRoute } from '@react-navigation/native';
import React, { useMemo } from 'react';
import RestoreCloudStep from '../components/backup/RestoreCloudStep';
import ChooseBackupStep from '@/components/backup/ChooseBackupStep';
import Routes from '@/navigation/routesNames';
import { createStackNavigator } from '@react-navigation/stack';

import { settingsOptions } from '@/navigation/config';
import { useTheme } from '@/theme';
import { Backup, BackupUserData } from '@/model/backup';
import { BackgroundProvider } from '@/design-system';
import { SimpleSheet } from '@/components/sheet/SimpleSheet';

const NativeStack = createStackNavigator();

export type RestoreSheetParams = {
  RestoreSheet: {
    backups: {
      files: Backup[];
    };
    userData: BackupUserData;
    fromSettings?: boolean;
  };
};

export function RestoreSheet() {
  const { params: { backups, userData, fromSettings } = {} } = useRoute<
    RouteProp<RestoreSheetParams, 'RestoreSheet'>
  >();

  const { colors } = useTheme();
  const memoSettingsOptions = useMemo(() => settingsOptions(colors), [colors]);

  return (
    <BackgroundProvider color="surfaceSecondary">
      {({ backgroundColor }) => (
        <SimpleSheet
          backgroundColor={backgroundColor as string}
          scrollEnabled={false}
        >
          <NativeStack.Navigator
            initialRouteName={Routes.CHOOSE_BACKUP_SHEET}
            screenOptions={{ ...memoSettingsOptions, title: '' }}
          >
            <NativeStack.Screen
              component={ChooseBackupStep}
              initialParams={{ backups, userData, fromSettings }}
              name={Routes.CHOOSE_BACKUP_SHEET}
            />
            <NativeStack.Screen
              component={RestoreCloudStep}
              initialParams={{ backups, userData, fromSettings }}
              name={Routes.RESTORE_CLOUD_SHEET}
            />
          </NativeStack.Navigator>
        </SimpleSheet>
      )}
    </BackgroundProvider>
  );
}
