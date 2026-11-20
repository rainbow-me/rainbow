import React, { useRef, useState } from 'react';

import { useIsSolanaEnabled } from '@/features/solana/hooks/useIsSolanaEnabled';
import { enableSolanaAccount } from '@/features/wallet/data/enableSolanaAccount';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { Menu } from '@/screens/SettingsSheet/components/Menu';
import { MenuItem } from '@/screens/SettingsSheet/components/MenuItem';

export function SolanaMvpMenu() {
  const enabled = useIsSolanaEnabled();
  return enabled ? <SolanaMvpControls /> : null;
}

function SolanaMvpControls() {
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);

  const run = async (operation: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      await operation();
    } catch (error) {
      Alert.alert('Solana test', error instanceof Error ? error.message.slice(0, 500) : 'Operation failed.');
    } finally {
      // eslint-disable-next-line require-atomic-updates -- only the operation holding this lock reaches finally
      lock.current = false;
      setBusy(false);
    }
  };

  return (
    <Menu header="Solana MVP · mainnet">
      <MenuItem
        disabled={busy}
        size={60}
        testID="solana-mvp-enable"
        titleComponent={<MenuItem.Title text="Enable Solana for this account" />}
        onPress={() =>
          run(async () => {
            const account = await enableSolanaAccount();
            Alert.alert('Solana enabled', `Subaccount ${account.index}\n\n${account.address}\n\nThe displayed EVM account stays selected.`);
          })
        }
      />
    </Menu>
  );
}
