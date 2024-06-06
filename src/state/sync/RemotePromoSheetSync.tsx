import { remotePromoSheetsStore } from '../remotePromoSheets/remotePromoSheets';
import { usePromoSheetCollectionQuery } from '@/resources/promoSheet/promoSheetCollectionQuery';
import { PromoSheetOrder } from '@/graphql/__generated__/arc';
import { useRunChecks } from '@/components/remote-promo-sheet/runChecks';
import { IS_TEST } from '@/env';

export const RemotePromoSheetSync = () => {
  usePromoSheetCollectionQuery(
    { order: [PromoSheetOrder.PriorityDesc] },
    {
      onSuccess: data => {
        remotePromoSheetsStore.getState().setSheets(data);
      },
      enabled: !IS_TEST,
    }
  );

  useRunChecks();

  return null;
};
