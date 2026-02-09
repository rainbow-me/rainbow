import CopyTooltip from '@/components/copy-tooltip';
import { Box, Text } from '@/design-system';
import { WalletLoadingStates } from '@/helpers/walletLoadingStates';
import { clear } from '@/keychain';
import { logger, RainbowError } from '@/logger';
import { createBackup, restoreBackup } from '@/model/backup';
import { clearAllStorages } from '@/model/mmkv';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { rainbowStorage } from '@/state/internal/rainbowStorage';
import { walletLoadingStore } from '@/state/walletLoading/walletLoading';
import { updateWalletsBackedUpState } from '@/state/wallets/updateWalletsBackedUpState';
import { clearWalletState } from '@/state/wallets/walletsStore';
import Clipboard from '@react-native-clipboard/clipboard';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { resetInternetCredentials } from 'react-native-keychain';

export const DevTestBackupState = () => {
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
            📋 Copy Backup!
          </Text>
        </CopyTooltip>
      </Box>

      <View style={{ height: 20 }} />

      <Pressable
        onPress={async () => {
          try {
            const backup = await Clipboard.getString();

            if (!backup) {
              Alert.alert(`No backup?`);
              return;
            }

            walletLoadingStore.setState({
              loadingState: WalletLoadingStates.IMPORTING_WALLET,
            });
            const restored = await restoreBackup(backup);
            logger.log(`restored: ${restored}`);

            if (restored) {
              await updateWalletsBackedUpState();
              Navigation.handleAction(Routes.WELCOME_SCREEN);
            } else {
              Alert.alert(`invalid backup`);
            }
          } catch (err) {
            logger.error(new RainbowError(`Error restoring`, err));
          } finally {
            walletLoadingStore.setState({
              loadingState: null,
            });
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

      <View style={{ height: 50 }} />

      <Pressable
        onPress={async () => {
          await clearWalletState({ resetKeychain: true });
          Navigation.handleAction(Routes.WELCOME_SCREEN);
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
            Clear All Wallets
          </Text>
        </Box>
      </Pressable>

      <View style={{ height: 20 }} />

      <Pressable
        onPress={async () => {
          await Promise.all([
            // attempt clearing as much as possible
            clearWalletState({ resetKeychain: true }),
            clearAllStorages(),
            clear(),
            resetInternetCredentials({}),
            rainbowStorage.clearAll(),
          ]);

          Navigation.handleAction(Routes.WELCOME_SCREEN);
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
            Clear All Storage ‼️
          </Text>
        </Box>
      </Pressable>
    </>
  );
};
