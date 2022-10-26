import * as React from 'react';
import { ScrollView } from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/core';
import { Box } from '@/design-system';
import { Page } from '@/components/layout';
import { Navbar } from '@/components/navbar/Navbar';
import DiscoverScreenContent from '@/components/discover-screen/DiscoverScreenContent';
import DiscoverSheetContext from '@/components/discover-screen/DiscoverScreenContext';
import CaretLeftIcon from '@/components/icons/svg/CaretLeftIcon';
import Routes from '@/navigation/routesNames';
import { useNavigation } from '@/navigation';

export default function DiscoverScreen() {
  const {
    params: { setSwipeEnabled: setViewPagerSwipeEnabled },
  } = useRoute<any>();
  const [isSearchModeEnabled, setIsSearchModeEnabled] = React.useState(false);

  const { navigate } = useNavigation();

  const handlePressWallet = React.useCallback(() => {
    navigate(Routes.WALLET_SCREEN);
  }, [navigate]);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setViewPagerSwipeEnabled(true);
      };
    }, [setViewPagerSwipeEnabled])
  );

  return (
    <DiscoverSheetContext.Provider
      // @ts-expect-error – JS component
      value={{ isSearchModeEnabled, setIsSearchModeEnabled }}
    >
      <Box as={Page} flex={1}>
        <Navbar
          hasStatusBarInset
          leftComponent={
            !isSearchModeEnabled ? (
              <Navbar.Item onPress={handlePressWallet} testID="wallet-button">
                <Navbar.SvgIcon icon={CaretLeftIcon} />
              </Navbar.Item>
            ) : null
          }
          testID={
            isSearchModeEnabled ? 'discover-header-search' : 'discover-header'
          }
          title={isSearchModeEnabled ? 'Search' : 'Discover'}
        />
        <Box
          as={ScrollView}
          contentContainerStyle={isSearchModeEnabled ? { height: '100%' } : {}}
          scrollEnabled={!isSearchModeEnabled}
          bounces={!isSearchModeEnabled}
          removeClippedSubviews
          testID="discover-sheet"
        >
          <DiscoverScreenContent />
        </Box>
      </Box>
    </DiscoverSheetContext.Provider>
  );
}
