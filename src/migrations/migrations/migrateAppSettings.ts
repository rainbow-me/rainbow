import { type StorageValue } from '@storesjs/stores';

import { useAppSettingsStore, type AppSettingsState } from '@/features/settings/data/appSettingsStore';
import { getGlobal } from '@/handlers/localstorage/common';
import { Language } from '@/languages/types';
import { MigrationName, type Migration } from '@/migrations/types';
import { rainbowStorage } from '@/state/internal/rainbowStorage';
import { Themes } from '@/theme/themes';

const ASSET_MANAGER_STORAGE_KEY = 'userAssetsStoreManager';
const LEGACY_CURRENCY_STORAGE_KEY = 'nativeCurrency';

/**
 * Moves the saved icon, currency, language, and theme into the app settings store.
 */
export function migrateAppSettings(): Migration {
  return {
    name: MigrationName.migrateAppSettings,
    async migrate() {
      const serialized = rainbowStorage.get(ASSET_MANAGER_STORAGE_KEY);
      const assetManager: StorageValue<Partial<Pick<AppSettingsState, 'currency'>>> | undefined = serialized
        ? JSON.parse(serialized)
        : undefined;
      const language: unknown = await getGlobal('language', Language.EN_US);
      const theme: unknown = await getGlobal('theme', Themes.SYSTEM);

      const settings: Pick<AppSettingsState, 'appIcon' | 'currency' | 'language' | 'theme'> = {
        appIcon: await getGlobal('appIcon', 'og'),
        currency: assetManager?.state.currency ?? (await getGlobal(LEGACY_CURRENCY_STORAGE_KEY, 'USD')),
        language: Object.values(Language).find(code => code === language) ?? Language.EN_US,
        theme: Object.values(Themes).find(value => value === theme) ?? Themes.SYSTEM,
      };

      useAppSettingsStore.setState(settings);
    },
  };
}
