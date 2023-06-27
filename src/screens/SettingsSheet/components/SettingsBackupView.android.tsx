import { useRoute } from '@react-navigation/native';
import React from 'react';
import AlreadyBackedUpView from './AlreadyBackedUpView';
import NeedsBackupView from './NeedsBackupView';
import { BackgroundProvider, Box, Inline, Inset, Text } from '@/design-system';
import { SimpleSheet } from '@/components/sheet/SimpleSheet';
import * as i18n from '@/languages';

export default function SettingsBackupView() {
  const { params } = useRoute();

  return (
    <BackgroundProvider color="surfaceSecondary">
      {({ backgroundColor }) => (
        <SimpleSheet backgroundColor={backgroundColor as string}>
          <Inset top="20px" horizontal="20px" bottom="60px">
            <Inline alignHorizontal="center" alignVertical="center">
              <Box paddingBottom="20px">
                <Text size="22pt" weight="heavy" color="label">
                  {i18n.t(i18n.l.settings.backup)}
                </Text>
              </Box>
            </Inline>
            {(params as any)?.type === 'AlreadyBackedUpView' ? (
              <AlreadyBackedUpView />
            ) : (
              <NeedsBackupView />
            )}
          </Inset>
        </SimpleSheet>
      )}
    </BackgroundProvider>
  );
  if ((params as any)?.type === 'AlreadyBackedUpView') {
    return <AlreadyBackedUpView />;
  } else {
    return <NeedsBackupView />;
  }
}
