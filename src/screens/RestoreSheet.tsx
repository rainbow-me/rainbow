import { RouteProp, useRoute } from '@react-navigation/native';
import React from 'react';
import { StatusBar } from 'react-native';
import RestoreCloudStep from '../components/backup/RestoreCloudStep';
import ChooseBackupStep from '@/components/backup/ChooseBackupStep';
import { SheetHandleFixedToTopHeight, SlackSheet } from '../components/sheet';
import { BackgroundProvider } from '@/design-system';
import { IS_ANDROID } from '@/env';
import { useDimensions } from '@/hooks';
import { deviceUtils } from '@/utils';
import Routes from '@/navigation/routesNames';

import createNativeStackNavigator from '@/react-native-cool-modals/createNativeStackNavigator';
import { nativeStackConfig } from '@/navigation/nativeStackConfig';

const NativeStack = createNativeStackNavigator();

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
  const { height: deviceHeight } = useDimensions();

  return (
    <BackgroundProvider color="surfaceSecondary">
      {({ backgroundColor }) => (
        <SlackSheet
          contentHeight={deviceHeight - SheetHandleFixedToTopHeight}
          additionalTopPadding={IS_ANDROID ? StatusBar.currentHeight : false}
          backgroundColor={backgroundColor}
          height="100%"
          testID="restore-sheet"
        >
          <NativeStack.Navigator
            {...nativeStackConfig}
            initialLayout={deviceUtils.dimensions}
            initialRouteName={Routes.CHOOSE_BACKUP_SHEET}
            screenOptions={{ swipeEnabled: false }}
            tabBar={() => null}
          >
            <NativeStack.Screen
              component={ChooseBackupStep}
              initialParams={{ userData }}
              name={Routes.CHOOSE_BACKUP_SHEET}
            />
            <NativeStack.Screen
              component={RestoreCloudStep}
              initialParams={{ userData }}
              name={Routes.RESTORE_SHEET}
            />
          </NativeStack.Navigator>
        </SlackSheet>
      )}
    </BackgroundProvider>
  );
}
