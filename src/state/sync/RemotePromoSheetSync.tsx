import React, { useCallback } from 'react';

import { remotePromoSheetsStore } from '../remotePromoSheets/remotePromoSheets';
import { usePromoSheetCollectionQuery } from '@/resources/promoSheet/promoSheetCollectionQuery';
import { GetPromoSheetCollectionQuery, PromoSheetOrder } from '@/graphql/__generated__/arc';
import { useRunChecks } from '@/components/remote-promo-sheet/runChecks';
import { IS_TEST } from '@/env';
import { useWalletsStore } from '../wallets/walletsStore';

const RemotePromoSheetSyncComponent = () => {
  const walletReady = useWalletsStore(state => state.walletReady);

  const onSuccess = useCallback((data: GetPromoSheetCollectionQuery) => {
    remotePromoSheetsStore.getState().setSheets(data);
  }, []);

  usePromoSheetCollectionQuery(
    { order: [PromoSheetOrder.PriorityDesc] },
    {
      onSuccess,
      enabled: !IS_TEST,
    }
  );

  useRunChecks({ walletReady });

  return null;
};

export const RemotePromoSheetSync = React.memo(RemotePromoSheetSyncComponent, () => true);
