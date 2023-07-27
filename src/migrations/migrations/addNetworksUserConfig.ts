import { Migration, MigrationName } from '@/migrations/types';
import * as ls from '@/storage';
import { RainbowNetworks } from '@/networks';

export function addNetworksUserConfig(): Migration {
  return {
    name: MigrationName.addNetworksUserConfig,
    async migrate() {
      const defaultNetworkConfig: { [key: string]: boolean } = {};
      RainbowNetworks.forEach(({ value }) => {
        defaultNetworkConfig[value] = true;
      });
      ls.device.set(['enabledNetworks'], defaultNetworkConfig);
    },
  };
}
