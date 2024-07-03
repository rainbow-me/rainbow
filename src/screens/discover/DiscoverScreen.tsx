import React, { useCallback, useEffect } from 'react';
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
import * as i18n from '@/languages';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';

export let discoverScrollToTopFnRef: () => number | null = () => null;
export default function DiscoverScreen() {
  const ref = React.useRef<ScrollView>(null);
  const { navigate } = useNavigation();
  const isFocused = useIsFocused();
  const { accountSymbol, accountColor, accountImage } = useAccountProfile();

  const scrollY = useSharedValue(0);
  const [isSearchModeEnabled, setIsSearchModeEnabled] = React.useState(false);

  const onChangeWallet = React.useCallback(() => {
    navigate(Routes.CHANGE_WALLET_SHEET);
  }, [navigate]);

  React.useEffect(() => {
    if (isSearchModeEnabled && !isFocused) {
      Keyboard.dismiss();
    }
  }, [isFocused, isSearchModeEnabled]);

  const scrollToTop = useCallback(() => {
    if (!ref.current) return -1;

    // detect if scroll was already at top and return 0;
    if (scrollY.value === 0) {
      return 0;
    }

    ref.current?.scrollTo({
      y: 0,
      animated: true,
    });

    return 1;
  }, [scrollY]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      scrollY.value = event.contentOffset.y;
    },
  });

  useEffect(() => {
    discoverScrollToTopFnRef = scrollToTop;
  }, [ref, scrollToTop]);

  return (
    <DiscoverSheetContext.Provider
      // @ts-expect-error – JS component
      value={{ isSearchModeEnabled, setIsSearchModeEnabled }}
    >
      <Box as={Page} flex={1}>
        <Navbar
          hasStatusBarInset
          leftComponent={
            <ButtonPressAnimation onPress={onChangeWallet} scaleTo={0.8} overflowMargin={50}>
              {accountImage ? (
                <ImageAvatar image={accountImage} marginRight={10} size="header" />
              ) : (
                <ContactAvatar color={accountColor} marginRight={10} size="small" value={accountSymbol} />
              )}
            </ButtonPressAnimation>
          }
          testID={isSearchModeEnabled ? 'discover-header-search' : 'discover-header'}
          title={isSearchModeEnabled ? i18n.t(i18n.l.discover.search.search) : i18n.t(i18n.l.discover.search.discover)}
        />
        <Box
          // @ts-expect-error not picking up the ScrollView ref prop
          ref={ref}
          as={Animated.ScrollView}
          automaticallyAdjustsScrollIndicatorInsets={false}
          contentContainerStyle={isSearchModeEnabled ? { height: '100%' } : {}}
          onScroll={scrollHandler}
          scrollEnabled={!isSearchModeEnabled}
          bounces={!isSearchModeEnabled}
          removeClippedSubviews
          scrollIndicatorInsets={{ bottom: safeAreaInsetValues.bottom + 167 }}
          testID="discover-sheet"
        >
          <DiscoverScreenContent />
        </Box>
      </Box>
    </DiscoverSheetContext.Provider>
  );
}
