import { BooleanMap } from '@/hooks/useCoinListEditOptions';
import { Migration, MigrationName } from '@/migrations/types';
import { loadAddress } from '@/model/wallet';
import { Network } from '@/networks/types';
import { getUniqueId } from '@/utils/ethereumUtils';
import { MMKV } from 'react-native-mmkv';

const mmkv = new MMKV();

export function migratePinnedAndHiddenTokenUniqueIds(): Migration {
  return {
    name: MigrationName.migratePinnedAndHiddenTokenUniqueIds,
    async defer() {
      const address = await loadAddress();
      const hiddenCoinsKey = 'hidden-coins-obj-' + address;
      const pinnedCoinsKey = 'pinned-coins-obj-' + address;
      const hiddenCoinsString = mmkv.getString(hiddenCoinsKey);
      const pinnedCoinsString = mmkv.getString(pinnedCoinsKey);
      const hiddenCoinsKeys = Object.keys(hiddenCoinsString ? JSON.parse(hiddenCoinsString) : {});
      const pinnedCoinsKeys = Object.keys(pinnedCoinsString ? JSON.parse(pinnedCoinsString) : {});
      const newHiddenCoins = hiddenCoinsKeys.reduce((acc, curr) => {
        if (!curr.includes('_')) {
          acc[getUniqueId(curr, Network.mainnet)] = true;
          return acc;
        }
        acc[curr] = true;
        return acc;
      }, {} as BooleanMap);

      const newPinnedCoins = pinnedCoinsKeys.reduce((acc, curr) => {
        if (!curr.includes('_')) {
          acc[getUniqueId(curr, Network.mainnet)] = true;
          return acc;
        }
        acc[curr] = true;
        return acc;
      }, {} as BooleanMap);

      mmkv.set('hidden-coins-obj-' + address, JSON.stringify(newHiddenCoins));
      mmkv.set('pinned-coins-obj-' + address, JSON.stringify(newPinnedCoins));
    },
  };
}
