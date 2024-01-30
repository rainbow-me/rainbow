import { RouteProp, useRoute } from '@react-navigation/native';
import React, { useMemo } from 'react';
import { StatusBar } from 'react-native';
import RestoreCloudStep from '../components/backup/RestoreCloudStep';
import ChooseBackupStep from '@/components/backup/ChooseBackupStep';
import { SheetHandleFixedToTopHeight, SlackSheet } from '../components/sheet';
import { BackgroundProvider } from '@/design-system';
import { IS_ANDROID } from '@/env';
import { useDimensions } from '@/hooks';
import { deviceUtils } from '@/utils';
import Routes from '@/navigation/routesNames';
import { createStackNavigator } from '@react-navigation/stack';

import createNativeStackNavigator from '@/react-native-cool-modals/createNativeStackNavigator';
import { nativeStackConfig } from '@/navigation/nativeStackConfig';
import { settingsOptions } from '@/navigation/config';
import { useTheme } from '@/theme';

const NativeStack = createStackNavigator();

type RestoreSheetParams = {
  RestoreSheet: {
    userData: any;
    fromSettings?: boolean;
  };
};

export function RestoreSheet() {
  const { params: { userData } = {} } = useRoute<
    RouteProp<RestoreSheetParams, 'RestoreSheet'>
  >();

  const { colors } = useTheme();
  const memoSettingsOptions = useMemo(() => settingsOptions(colors), [colors]);

  return (
    <NativeStack.Navigator
      initialRouteName={Routes.CHOOSE_BACKUP_SHEET}
      screenOptions={{ ...memoSettingsOptions, title: '' }}
    >
      <NativeStack.Screen
        component={ChooseBackupStep}
        initialParams={{ userData }}
        name={Routes.CHOOSE_BACKUP_SHEET}
      />
      <NativeStack.Screen
        component={RestoreCloudStep}
        initialParams={{ userData }}
        name={Routes.RESTORE_CLOUD_SHEET}
      />
    </NativeStack.Navigator>
  );
}
