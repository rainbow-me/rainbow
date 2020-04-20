import { ACCESSIBLE } from 'react-native-keychain';
import {
  getMigrationVersion,
  setMigrationVersion,
} from '../handlers/localstorage/migrations';

import { loadAddress, saveAddress } from '../model/wallet';

import { logger } from '../utils';

export default async function runMigrations() {
  // get current version
  const currentVersion = Number(await getMigrationVersion());
  const migrations = [];

  /***** Migration v0 starts here  *****/
  const v0 = async () => {
    const walletAddress = await loadAddress();
    const publicAccessControlOptions = {
      accessible: ACCESSIBLE.ALWAYS_THIS_DEVICE_ONLY,
    };
    if (walletAddress) {
      saveAddress(walletAddress, publicAccessControlOptions);
    }
  };

  migrations.push(v0);

  /***** Migration v0 ends here  *****/

  logger.log(
    'Migrations: ready to run migrations starting on number',
    currentVersion
  );
  if (migrations.length === currentVersion) {
    logger.log(`Migrations: Nothing to run`);
    return;
  }

  for (let i = currentVersion; i < migrations.length; i++) {
    logger.log(`Migrations: Runing migration ${i}`);
    migrations[i].apply(null);
    logger.log(`Migrations: Migration ${i} completed succesfully`);
    await setMigrationVersion(i + 1);
  }
}
