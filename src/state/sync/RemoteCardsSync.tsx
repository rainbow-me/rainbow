import { useCardCollectionQuery } from '@/resources/cards/cardCollectionQuery';
import { remoteCardsStore } from '../remoteCards/remoteCards';
import { IS_TEST } from '@/env';

export const RemoteCardsSync = () => {
  useCardCollectionQuery({
    onSuccess: data => {
      remoteCardsStore.getState().setCards(data);
    },
    enabled: !IS_TEST,
  });

  return null;
};
