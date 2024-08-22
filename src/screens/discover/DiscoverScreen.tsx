import React, { useCallback, useEffect } from 'react';
import { Keyboard, ScrollView } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Box } from '@/design-system';
import { Page } from '@/components/layout';
import { Navbar } from '@/components/navbar/Navbar';
import DiscoverScreenContent from './components/DiscoverScreenContent';
import { DiscoverScreenProvider, useDiscoverScreenContext } from './DiscoverScreenContext';
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

const DiscoverNavbar = () => {
  const { accountSymbol, accountColor, accountImage } = useAccountProfile();
  const { isSearchModeEnabled } = useDiscoverScreenContext();
  const { navigate } = useNavigation();

  const onChangeWallet = React.useCallback(() => {
    navigate(Routes.CHANGE_WALLET_SHEET);
  }, [navigate]);

  return (
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
  );
};

const DiscoverScreenWrapper = () => {
  const scrollY = useSharedValue(0);
  const ref = React.useRef<Animated.ScrollView | null>(null);
  const { isSearchModeEnabled } = useDiscoverScreenContext();

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

  useEffect(() => {
    discoverScrollToTopFnRef = scrollToTop;
  }, [ref, scrollToTop]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      scrollY.value = event.contentOffset.y;
    },
  });

  return (
    <Box
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
  );
};

export default function DiscoverScreen() {
  return (
    <DiscoverScreenProvider>
      <Box as={Page} flex={1}>
        <DiscoverNavbar />
        <DiscoverScreenWrapper />
      </Box>
    </DiscoverScreenProvider>
  );
}
