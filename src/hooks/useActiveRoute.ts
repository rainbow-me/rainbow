import { Navigation, useNavigation } from '@/navigation';
import { useEffect, useState } from 'react';

export const useActiveRoute = () => {
  const { addListener } = useNavigation();
  const [activeRoute, setActiveRoute] = useState(Navigation.getActiveRoute());

  useEffect(() => {
    const unsubscribe = addListener('state', () => {
      setActiveRoute(Navigation.getActiveRoute());
    });
    return unsubscribe;
  }, [addListener]);

  return activeRoute?.name;
};
