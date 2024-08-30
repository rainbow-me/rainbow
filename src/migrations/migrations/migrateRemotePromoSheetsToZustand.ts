import { PromoSheetOrder } from '@/graphql/__generated__/arc';
import { RainbowError, logger } from '@/logger';
import { fetchPromoSheetCollection } from '@/resources/promoSheet/promoSheetCollectionQuery';
import { remotePromoSheetsStore } from '@/state/remotePromoSheets/remotePromoSheets';
import { campaigns } from '@/storage';
import { Migration, MigrationName } from '@/migrations/types';

export function migrateRemotePromoSheetsToZustand(): Migration {
  return {
    name: MigrationName.migrateRemotePromoSheetsToZustand,
    async migrate() {
      try {
        const remotePromoSheets = await fetchPromoSheetCollection({ order: [PromoSheetOrder.PriorityDesc] });

        // Update store to have all the sheets
        remotePromoSheetsStore.getState().setSheets(remotePromoSheets);

        for (const sheet of remotePromoSheets.promoSheetCollection?.items ?? []) {
          if (!sheet?.campaignKey) continue;

          const hasShown = campaigns.get([sheet.campaignKey]);
          if (!hasShown) continue;

          remotePromoSheetsStore.getState().setSheet(sheet.sys.id, {
            ...sheet,
            hasBeenShown: true,
          });
        }
      } catch (error) {
        logger.error(new RainbowError(`Failed to migrate remote promo sheets to zustand`), {
          data: error,
        });
      }
    },
  };
}
