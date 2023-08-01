import * as React from 'react';
import { Keyboard, ScrollView } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Box } from '@/design-system';
import { Page } from '@/components/layout';
import { Navbar } from '@/components/navbar/Navbar';
import DiscoverScreenContent from './components/DiscoverScreenContent';
import DiscoverSheetContext from './DiscoverScreenContext';
import { ButtonPressAnimation } from '@/components/animations';
import { ContactAvatar } from '@/components/contacts';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { useAccountProfile } from '@/hooks';
import Routes from '@/navigation/routesNames';
import { useNavigation } from '@/navigation';
import { safeAreaInsetValues } from '@/utils';

export default function DiscoverScreen() {
  const { navigate } = useNavigation();
  const isFocused = useIsFocused();
  const { accountSymbol, accountColor, accountImage } = useAccountProfile();

  const [isSearchModeEnabled, setIsSearchModeEnabled] = React.useState(false);

  const onChangeWallet = React.useCallback(() => {
    navigate(Routes.CHANGE_WALLET_SHEET);
  }, [navigate]);

  React.useEffect(() => {
    if (isSearchModeEnabled && !isFocused) {
      Keyboard.dismiss();
    }
  }, [isFocused, isSearchModeEnabled]);

  return (
    <DiscoverSheetContext.Provider
      // @ts-expect-error – JS component
      value={{ isSearchModeEnabled, setIsSearchModeEnabled }}
    >
      <Box as={Page} flex={1}>
        <Navbar
          hasStatusBarInset
          leftComponent={
            <ButtonPressAnimation onPress={onChangeWallet} scaleTo={0.8}>
              {accountImage ? (
                <ImageAvatar
                  image={accountImage}
                  marginRight={10}
                  size="header"
                />
              ) : (
                <ContactAvatar
                  color={accountColor}
                  marginRight={10}
                  size="small"
                  value={accountSymbol}
                />
              )}
            </ButtonPressAnimation>
          }
          testID={
            isSearchModeEnabled ? 'discover-header-search' : 'discover-header'
          }
          title={isSearchModeEnabled ? 'Search' : 'Discover'}
        />
        <Box
          as={ScrollView}
          automaticallyAdjustsScrollIndicatorInsets={false}
          contentContainerStyle={isSearchModeEnabled ? { height: '100%' } : {}}
          scrollEnabled={!isSearchModeEnabled}
          bounces={!isSearchModeEnabled}
          removeClippedSubviews
          scrollIndicatorInsets={{ bottom: safeAreaInsetValues.bottom + 197 }}
          testID="discover-sheet"
        >
          <DiscoverScreenContent />
        </Box>
      </Box>
    </DiscoverSheetContext.Provider>
  );
}
