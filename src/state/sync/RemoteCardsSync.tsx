import { useCardCollectionQuery } from '@/resources/cards/cardCollectionQuery';
import { remoteCardsStore } from '../remoteCards/remoteCards';

export const RemoteCardsSync = () => {
  useCardCollectionQuery({
    onSuccess: data => {
      remoteCardsStore.getState().setCards(data);
    },
  });

  return null;
};
