import { useCardCollectionQuery } from '@/resources/cards/cardCollectionQuery';
import { remoteCardsStore } from '../remoteCards/remoteCards';

export const RemoteCardsSync = () => {
  useCardCollectionQuery({
    onSuccess: data => {
      remoteCardsStore.getState().setCards(data);
    },
    cacheTime: 0,
    staleTime: 1000 * 60, // 1 minute
  });

  return null;
};
