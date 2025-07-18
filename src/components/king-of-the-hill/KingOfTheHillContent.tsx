import React from 'react';
import { useKingOfTheHillStore } from '@/state/kingOfTheHill/kingOfTheHillStore';
import { Skeleton } from '@/screens/points/components/Skeleton';
import { useNavigationStore } from '@/state/navigation/navigationStore';
import { usePrevious } from '@/hooks';
import Routes from '@/navigation/routesNames';
import isEqual from 'react-fast-compare';
import { Header } from './Header';

function SyncStoreEnabled() {
  const activeSwipeRoute = useNavigationStore(state => state.activeSwipeRoute);
  const previousActiveSwipeRoute = usePrevious(activeSwipeRoute);

  if (activeSwipeRoute === Routes.DISCOVER_SCREEN && previousActiveSwipeRoute !== Routes.DISCOVER_SCREEN) {
    useKingOfTheHillStore.setState({
      enabled: true,
    });
  }
  return null;
}

export const KingOfTheHillContent = () => {
  const kingOfTheHill = useKingOfTheHillStore(store => store.getData(), isEqual);

  return (
    <>
      {!kingOfTheHill && <Skeleton width={'100%'} height={400} />}
      {kingOfTheHill && <Header kingOfTheHill={kingOfTheHill} />}
      <SyncStoreEnabled />
    </>
  );
};
