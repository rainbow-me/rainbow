import { BooleanMap } from '@/hooks/useCoinListEditOptions';
import { Migration, MigrationName } from '@/migrations/types';
import { loadAddress } from '@/model/wallet';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

export function fixHiddenUSDC(): Migration {
  return {
    name: MigrationName.fixHiddenUSDC,
    async defer() {
      // get account address from local storage
      const accountAddress = await loadAddress();
      const storageKey = 'hidden-coins-obj-' + accountAddress;
      const hiddenTokensEntry = storage.getString(storageKey);

      // all usdc tokens on our supported networks
      const keysToRemove = [
        '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        '0x2791bca1f2de4661ed88a30c99a7a9449aa84174_polygon',
        '0x7f5c764cbc14f9669b88837ca1490cca17c31607_optimism',
        '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8_arbitrum',
        '0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca_base',
        '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d_bsc',
      ];
      if (hiddenTokensEntry) {
        const list = Object.keys(JSON.parse(hiddenTokensEntry));

        // filter out USDC tokens
        const newHiddenCoins = [...list.filter((i: string) => !keysToRemove.includes(i))].reduce((acc, curr) => {
          acc[curr] = true;
          return acc;
        }, {} as BooleanMap);

        // save to storage
        storage.set(storageKey, JSON.stringify(newHiddenCoins));
      }
    },
  };
}
