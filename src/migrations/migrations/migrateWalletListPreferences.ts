import { createMMKV } from 'react-native-mmkv';

import { usePinnedCoinsStore, type BooleanMap } from '@/features/wallet/data/walletScreen/base/pinnedCoinsStore';
import {
  useWalletListTogglesStore,
  walletListTogglesActions,
  type ListSectionToggles,
} from '@/features/wallet/data/walletScreen/base/walletListTogglesStore';
import { MigrationName, type Migration } from '@/migrations/types';

const PINNED_PREFIX = 'pinned-coins-obj-';
const TOGGLE_PREFIXES = [
  ['claimables-open-', 'claimables'],
  ['positions-open-', 'positions'],
  ['polymarket-open-', 'predictions'],
] as const;

/**
 * Moves per-wallet pins and section toggles into their persisted stores.
 */
export function migrateWalletListPreferences(): Migration {
  return {
    name: MigrationName.migrateWalletListPreferences,
    async migrate() {
      const storage = createMMKV();
      const pinnedCoins: Record<string, BooleanMap> = {};
      const togglesByWallet: Partial<Record<string, ListSectionToggles>> = {};
      const migratedKeys: string[] = [];

      for (const key of storage.getAllKeys()) {
        if (key.startsWith(PINNED_PREFIX)) {
          const serialized = storage.getString(key);
          if (!serialized) continue;

          const value: unknown = JSON.parse(serialized);
          if (!isBooleanMap(value)) throw new Error(`Invalid saved pins: ${key}`);

          const pins: BooleanMap = {};
          for (const id in value) {
            if (value[id]) pins[id.toLowerCase()] = true;
          }

          pinnedCoins[key.slice(PINNED_PREFIX.length)] = pins;
          migratedKeys.push(key);
          continue;
        }

        for (const [prefix, section] of TOGGLE_PREFIXES) {
          if (!key.startsWith(prefix)) continue;

          const address = key.slice(prefix.length);
          togglesByWallet[address] = {
            ...(togglesByWallet[address] ?? walletListTogglesActions.getCurrentToggles(address)),
            [section]: storage.getBoolean(key) ?? false,
          };
          migratedKeys.push(key);
          break;
        }
      }

      usePinnedCoinsStore.setState(state => ({
        pinnedCoins: { ...pinnedCoins, ...state.pinnedCoins },
      }));

      useWalletListTogglesStore.setState(state => ({
        togglesByWallet: { ...togglesByWallet, ...state.togglesByWallet },
      }));

      for (const key of migratedKeys) {
        storage.remove(key);
      }
    },
  };
}

function isBooleanMap(value: unknown): value is BooleanMap {
  return (
    typeof value === 'object' && value !== null && !Array.isArray(value) && Object.values(value).every(item => typeof item === 'boolean')
  );
}
