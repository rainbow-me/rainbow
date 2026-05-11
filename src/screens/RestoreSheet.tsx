import React, { useMemo } from 'react';

import { useRoute, type RouteProp } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SimpleSheet } from '@/components/sheet/SimpleSheet';
import { BackgroundProvider } from '@/design-system';
import ChooseBackupStep from '@/features/backup/components/ChooseBackupStep';
import RestoreCloudStep from '@/features/backup/components/RestoreCloudStep';
import useDimensions from '@/hooks/useDimensions';
import { settingsOptions } from '@/navigation/config';
import Routes from '@/navigation/routesNames';
import { type RootStackParamList } from '@/navigation/types';
import { useTheme } from '@/theme/ThemeContext';

const NativeStack = createStackNavigator();

export function RestoreSheet() {
  const { top } = useSafeAreaInsets();
  const { height: deviceHeight } = useDimensions();
  const { params: { fromSettings = false } = {} } = useRoute<RouteProp<RootStackParamList, typeof Routes.RESTORE_SHEET>>();

  const { colors } = useTheme();
  const memoSettingsOptions = useMemo(() => settingsOptions(colors, fromSettings), [colors, fromSettings]);

  return (
    <BackgroundProvider color="surfaceSecondary">
      {({ backgroundColor }) => (
        <SimpleSheet
          backgroundColor={backgroundColor as string}
          useAdditionalTopPadding
          customHeight={deviceHeight - top}
          scrollEnabled={false}
        >
          <NativeStack.Navigator initialRouteName={Routes.CHOOSE_BACKUP_SHEET} screenOptions={{ ...memoSettingsOptions, title: '' }}>
            <NativeStack.Screen component={ChooseBackupStep} initialParams={{ fromSettings }} name={Routes.CHOOSE_BACKUP_SHEET} />
            <NativeStack.Screen component={RestoreCloudStep} initialParams={{ fromSettings }} name={Routes.RESTORE_CLOUD_SHEET} />
          </NativeStack.Navigator>
        </SimpleSheet>
      )}
    </BackgroundProvider>
  );
}
