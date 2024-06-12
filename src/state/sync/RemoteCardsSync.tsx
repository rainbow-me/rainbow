import { TrimmedCards, useCardCollectionQuery } from '@/resources/cards/cardCollectionQuery';
import { remoteCardsStore } from '../remoteCards/remoteCards';
import { IS_TEST } from '@/env';
import { useCallback, memo } from 'react';

const RemoteCardsSyncComponent = () => {
  const onSuccess = useCallback((data: TrimmedCards) => {
    remoteCardsStore.getState().setCards(data);
  }, []);

  useCardCollectionQuery({
    onSuccess,
    enabled: !IS_TEST,
  });

  return null;
};

export const RemoteCardsSync = memo(RemoteCardsSyncComponent, () => true);
