import * as React from 'react';
import { ScrollView } from 'react-native';
import { Box } from '@/design-system';
import { Page } from '@/components/layout';
import { Navbar } from '@/components/navbar/Navbar';
import DiscoverSheetContent from '@/components/discover-sheet/DiscoverSheetContent';
import DiscoverSheetContext from '@/components/discover-sheet/DiscoverSheetContext';
import CaretLeftIcon from '@/components/icons/svg/CaretLeftIcon';
import Routes from '@/navigation/routesNames';
import { useNavigation } from '@/navigation';

export default function DiscoverScreen() {
  const [isSearchModeEnabled, setIsSearchModeEnabled] = React.useState(false);

  const { navigate } = useNavigation();

  const handlePressWallet = React.useCallback(() => {
    navigate(Routes.WALLET_SCREEN);
  }, [navigate]);

  return (
    <DiscoverSheetContext.Provider
      // @ts-expect-error – JS component
      value={{ isSearchModeEnabled, setIsSearchModeEnabled }}
    >
      <Box as={Page} flex={1}>
        <Navbar
          hasStatusBarInset
          leftComponent={
            <Navbar.Item onPress={handlePressWallet} testID="wallet-button">
              <Navbar.SvgIcon icon={CaretLeftIcon} />
            </Navbar.Item>
          }
          title={isSearchModeEnabled ? 'Search' : 'Discover'}
        />
        <Box
          as={ScrollView}
          contentContainerStyle={isSearchModeEnabled ? { height: '100%' } : {}}
          scrollEnabled={!isSearchModeEnabled}
          bounces={!isSearchModeEnabled}
          removeClippedSubviews
        >
          <DiscoverSheetContent />
        </Box>
      </Box>
    </DiscoverSheetContext.Provider>
  );
}
