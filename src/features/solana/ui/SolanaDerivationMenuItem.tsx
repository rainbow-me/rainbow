import React, { useState } from 'react';

import Clipboard from '@react-native-clipboard/clipboard';

import { deriveSelectedSolanaAddress } from '@/features/solana/data/deriveSelectedSolanaAddress';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { EthereumWalletType } from '@/helpers/walletTypes';
import { MenuItem } from '@/screens/SettingsSheet/components/MenuItem';
import { SettingsLoadingIndicator } from '@/screens/SettingsSheet/components/SettingsLoadingIndicator';
import { useWalletsStore } from '@/state/wallets/walletsStore';

export function SolanaDerivationMenuItem() {
  const isMnemonicWallet = useWalletsStore(state => state.selected?.type === EthereumWalletType.mnemonic);
  const [busy, setBusy] = useState(false);

  const deriveAddress = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await deriveSelectedSolanaAddress();
      if (!result) return;

      Alert.alert(
        'Solana address',
        `${result.address}\n\nAccount index: ${result.accountIndex}\nPath: ${result.derivationPath}\n\nSource Ethereum account:\n${result.sourceAddress}`,
        [
          { text: 'Done', style: 'cancel' },
          { text: 'Copy address', onPress: () => Clipboard.setString(result.address) },
        ]
      );
    } catch {
      Alert.alert('Unable to derive Solana address', 'Check that the selected wallet has an accessible recovery phrase and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <MenuItem
      disabled={busy || !isMnemonicWallet}
      labelComponent={!isMnemonicWallet && <MenuItem.Label text="Select a recovery phrase wallet" />}
      leftComponent={<MenuItem.TextIcon icon="🔑" isEmoji />}
      onPress={deriveAddress}
      rightComponent={busy && <SettingsLoadingIndicator />}
      size={isMnemonicWallet ? 52 : 76}
      testID="derive-solana-address"
      titleComponent={<MenuItem.Title text="Derive Solana address" disabled={!isMnemonicWallet} />}
    />
  );
}
