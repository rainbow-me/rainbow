import CopyTooltip from '@/components/copy-tooltip';
import { Box, Text } from '@/design-system';
import { WalletLoadingStates } from '@/helpers/walletLoadingStates';
import { logger, RainbowError } from '@/logger';
import { createBackup, restoreBackup } from '@/model/backup';
import { wipeKeychain } from '@/model/keychain';
import { clearAllStorages } from '@/model/mmkv';
import { navigate, useNavigation } from '@/navigation/Navigation';
import Routes from '@/navigation/Routes';
import { walletLoadingStore } from '@/state/walletLoading/walletLoading';
import { updateWalletsBackedUpState } from '@/state/wallets/updateWalletsBackedUpState';
import { clearWalletState, loadWallets } from '@/state/wallets/walletsStore';
import Clipboard from '@react-native-clipboard/clipboard';
import React, { useEffect, useState } from 'react';
import { Alert, DevSettings, Pressable, View } from 'react-native';

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
              DevSettings.reload();
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

      <View style={{ height: 100 }} />

      <Pressable
        onPress={async () => {
          await wipeKeychain();
          await clearAllStorages();
          clearWalletState();
          DevSettings.reload();
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
