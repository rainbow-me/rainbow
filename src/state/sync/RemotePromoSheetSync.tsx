import { remotePromoSheetsStore } from '../remotePromoSheets/remotePromoSheets';
import { usePromoSheetCollectionQuery } from '@/resources/promoSheet/promoSheetCollectionQuery';
import { PromoSheetOrder } from '@/graphql/__generated__/arc';
import { useRunChecks } from '@/components/remote-promo-sheet/runChecks';

export const RemotePromoSheetSync = () => {
  usePromoSheetCollectionQuery(
    { order: [PromoSheetOrder.PriorityDesc] },
    {
      onSuccess: data => {
        remotePromoSheetsStore.getState().setSheets(data);
      },
    }
  );

  useRunChecks();

  return null;
};
