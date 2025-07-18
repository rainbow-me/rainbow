import React, { useState, useCallback } from 'react';
import { useKingOfTheHillStore } from '@/state/kingOfTheHill/kingOfTheHillStore';
import { Skeleton } from '@/screens/points/components/Skeleton';
import { useNavigationStore } from '@/state/navigation/navigationStore';
import { usePrevious } from '@/hooks';
import Routes from '@/navigation/routesNames';
import isEqual from 'react-fast-compare';
import { Header } from './Header';
import { Box, useColorMode } from '@/design-system';
import makeColorMoreChill from 'make-color-more-chill';
import chroma from 'chroma-js';

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
  const { isDarkMode } = useColorMode();
  const [backgroundColor, setBackgroundColor] = useState<string | null>(null);
  
  const handleColorExtracted = useCallback((color: string | null) => {
    try {
      if (color) {
        // Make the color more chill and adjust for theme
        const chillColor = makeColorMoreChill(color);
        const adjustedColor = isDarkMode 
          ? chroma(chillColor).darken(2.5).alpha(0.15).css()
          : chroma(chillColor).brighten(2).alpha(0.1).css();
        setBackgroundColor(adjustedColor);
      }
    } catch (error) {
      console.warn('Error adjusting color:', error);
      // Fallback to transparent
      setBackgroundColor(null);
    }
  }, [isDarkMode]);

  return (
    <>
      <Box 
        backgroundColor={backgroundColor || undefined}
        borderRadius={20}
        padding="20px"
      >
        {!kingOfTheHill && <Skeleton width={'100%'} height={400} />}
        {kingOfTheHill && <Header kingOfTheHill={kingOfTheHill} onColorExtracted={handleColorExtracted} />}
      </Box>
      <SyncStoreEnabled />
    </>
  );
};
