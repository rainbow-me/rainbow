import { useRoute } from '@react-navigation/native';
import React from 'react';
import { StatusBar } from 'react-native';
import RestoreCloudStep from '../components/backup/RestoreCloudStep';
import { SheetHandleFixedToTopHeight, SlackSheet } from '../components/sheet';
import { BackgroundProvider } from '@/design-system';
import { IS_ANDROID } from '@/env';
import { useDimensions } from '@/hooks';

export function RestoreSheet() {
  const {
    params: { userData, backupSelected, fromSettings } = {},
  } = useRoute();
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
          <RestoreCloudStep
            backupSelected={backupSelected}
            fromSettings={fromSettings}
            userData={userData}
          />
        </SlackSheet>
      )}
    </BackgroundProvider>
  );
}
