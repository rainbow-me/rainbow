import { RouteProp, useRoute } from '@react-navigation/native';
import React, { useMemo } from 'react';
import RestoreCloudStep from '../components/backup/RestoreCloudStep';
import ChooseBackupStep from '@/components/backup/ChooseBackupStep';
import Routes from '@/navigation/routesNames';
import { createStackNavigator } from '@react-navigation/stack';

import { settingsOptions, sharedCoolModalTopOffset } from '@/navigation/config';
import { useTheme } from '@/theme';
import { BackgroundProvider } from '@/design-system';
import { SimpleSheet } from '@/components/sheet/SimpleSheet';
import { useDimensions } from '@/hooks';
import { IS_ANDROID } from '@/env';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const NativeStack = createStackNavigator();

export type RestoreSheetParams = {
  RestoreSheet: {
    fromSettings?: boolean;
  };
};

export function RestoreSheet() {
  const { top } = useSafeAreaInsets();
  const { height: deviceHeight } = useDimensions();
  const { params: { fromSettings = false } = {} } = useRoute<RouteProp<RestoreSheetParams, 'RestoreSheet'>>();

  const { colors } = useTheme();
  const memoSettingsOptions = useMemo(() => settingsOptions(colors, fromSettings), [colors, fromSettings]);

  return (
    <BackgroundProvider color="surfaceSecondary">
      {({ backgroundColor }) => (
        <SimpleSheet
          backgroundColor={backgroundColor as string}
          useAdditionalTopPadding
          customHeight={IS_ANDROID ? deviceHeight - top : deviceHeight - sharedCoolModalTopOffset}
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
