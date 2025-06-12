import CopyTooltip from '@/components/copy-tooltip';
import { Box, Text } from '@/design-system';
import { createBackup, restoreBackup } from '@/model/backup';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { wipeKeychain } from '@/model/keychain';
import { clearAllStorages } from '@/model/mmkv';
import { navigate, useNavigation } from '@/navigation/Navigation';
import Routes from '@/navigation/Routes';

export const DevTestBackupState = () => {
  const { goBack } = useNavigation();
  const [exported, setExported] = useState('test123');

  useEffect(() => {
    createBackup({
      onError(err) {
        console.log(`Error creating backup: ${err}`);
      },
    }).then(backup => {
      setExported(JSON.stringify(backup));
    });
  }, []);

  return (
    <>
      <Box
        background="card (Deprecated)"
        borderRadius={25}
        height={{ custom: 50 }}
        paddingHorizontal="24px"
        paddingVertical="19px (Deprecated)"
        shadow="21px light (Deprecated)"
      >
        <CopyTooltip textToCopy={exported} tooltipText="Copy">
          <Text color="base" size="15pt">
            Copy Backup!
          </Text>
        </CopyTooltip>
      </Box>

      <View style={{ height: 20 }} />

      <Pressable
        onPress={async () => {
          const backup = await Clipboard.getString();
          const restored = await restoreBackup(backup);
          if (restored) {
            goBack();
          } else {
            Alert.alert(`invalid backup`);
          }
        }}
      >
        <Box
          background="card (Deprecated)"
          borderRadius={25}
          height={{ custom: 50 }}
          paddingHorizontal="24px"
          paddingVertical="19px (Deprecated)"
          shadow="21px light (Deprecated)"
        >
          <Text color="base" size="15pt">
            Restore from Paste!
          </Text>
        </Box>
      </Pressable>

      <View style={{ height: 100 }} />

      <Pressable
        onPress={async () => {
          await wipeKeychain();
          await clearAllStorages();
          // we need to navigate back to the welcome screen
          navigate(Routes.WELCOME_SCREEN);
        }}
      >
        <Box
          background="card (Deprecated)"
          borderRadius={25}
          height={{ custom: 50 }}
          paddingHorizontal="24px"
          paddingVertical="19px (Deprecated)"
          shadow="21px light (Deprecated)"
        >
          <Text color="base" size="15pt">
            Clear All Wallets/State (‼️)
          </Text>
        </Box>
      </Pressable>
    </>
  );
};
