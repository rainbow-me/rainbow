import { unlockableAppIconStorage } from '@/featuresToUnlock/unlockableAppIconCheck';
import { Migration, MigrationName } from '@/migrations/types';
import { MMKV } from 'react-native-mmkv';

const mmkv = new MMKV();

export function migrateUnlockableAppIconStorage(): Migration {
  return {
    name: MigrationName.migrateUnlockableAppIconStorage,
    async migrate() {
      const optimismAppIconUnlocked = mmkv.getBoolean('optimism_nft_app_icon');
      const smolAppIconUnlocked = mmkv.getBoolean('smol_nft_app_icon');
      const zoraAppIconUnlocked = mmkv.getBoolean('zora_nft_app_icon');
      const goldDogeAppIconUnlocked = mmkv.getBoolean('golddoge_nft_app_icon');
      const rainDogeAppIconUnlocked = mmkv.getBoolean('raindoge_nft_app_icon');
      const poolyAppIconUnlocked = mmkv.getBoolean('pooly_nft_app_icon');
      const finiliarAppIconUnlocked = mmkv.getBoolean('finiliar_nft_app_icon');
      const zorbAppIconUnlocked = mmkv.getBoolean('zorb_nft_app_icon');
      const poolboyAppIconUnlocked = mmkv.getBoolean('poolboy_nft_app_icon');
      const adworldAppIconUnlocked = mmkv.getBoolean('adworld_nft_app_icon');
      const farcasterAppIconUnlocked = mmkv.getBoolean('farcaster_nft_app_icon');

      unlockableAppIconStorage.set('optimism', !!optimismAppIconUnlocked);
      unlockableAppIconStorage.set('smol', !!smolAppIconUnlocked);
      unlockableAppIconStorage.set('zora', !!zoraAppIconUnlocked);
      unlockableAppIconStorage.set('golddoge', !!goldDogeAppIconUnlocked);
      unlockableAppIconStorage.set('raindoge', !!rainDogeAppIconUnlocked);
      unlockableAppIconStorage.set('pooly', !!poolyAppIconUnlocked);
      unlockableAppIconStorage.set('finiliar', !!finiliarAppIconUnlocked);
      unlockableAppIconStorage.set('zorb', !!zorbAppIconUnlocked);
      unlockableAppIconStorage.set('poolboy', !!poolboyAppIconUnlocked);
      unlockableAppIconStorage.set('adworld', !!adworldAppIconUnlocked);
      unlockableAppIconStorage.set('farcaster', !!farcasterAppIconUnlocked);
    },
  };
}
