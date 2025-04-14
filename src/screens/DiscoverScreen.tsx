import { useDiscoverSearchQueryStore } from '@/__swaps__/screens/Swap/resources/search/searchV2';
import { ButtonPressAnimation } from '@/components/animations';
import { ContactAvatar } from '@/components/contacts';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import DiscoverScreenContent from '@/components/Discover/DiscoverScreenContent';
import DiscoverScreenProvider, { useDiscoverScreenContext } from '@/components/Discover/DiscoverScreenContext';
import { Page } from '@/components/layout';
import { Navbar } from '@/components/navbar/Navbar';
import { Box } from '@/design-system';
import { IS_IOS } from '@/env';
import * as i18n from '@/languages';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { useAccountProfileInfo } from '@/state/wallets/walletsStore';
import { safeAreaInsetValues } from '@/utils';
import { useIsFocused } from '@react-navigation/native';
import React, { memo, useEffect } from 'react';
import { Keyboard } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { PullToRefresh } from './Airdrops/AirdropsSheet';

export let discoverScrollToTopFnRef: () => number | null = () => null;

const Content = () => {
  const { navigate } = useNavigation();
  const { accountSymbol, accountColor, accountImage } = useAccountProfileInfo();

  const { scrollToTop, scrollViewRef } = useDiscoverScreenContext();
  const isSearching = useDiscoverSearchQueryStore(state => state.isSearching);
  const scrollY = useSharedValue(0);

  const onChangeWallet = React.useCallback(() => {
    navigate(Routes.CHANGE_WALLET_SHEET);
  }, [navigate]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      scrollY.value = event.contentOffset.y;
    },
  });

  useEffect(() => {
    discoverScrollToTopFnRef = scrollToTop;
  }, [scrollToTop]);

  return (
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
        testID={isSearching ? 'discover-header-search' : 'discover-header'}
        title={isSearching ? i18n.t(i18n.l.discover.search.search) : i18n.t(i18n.l.discover.search.discover)}
      />
      <Box
        ref={scrollViewRef}
        as={Animated.ScrollView}
        automaticallyAdjustsScrollIndicatorInsets={false}
        contentContainerStyle={isSearching ? { height: '100%' } : {}}
        onScroll={scrollHandler}
        scrollEnabled={!isSearching}
        bounces={!isSearching}
        refreshControl={IS_IOS ? <PullToRefresh /> : undefined}
        removeClippedSubviews
        scrollIndicatorInsets={{ bottom: safeAreaInsetValues.bottom + 167 }}
        testID="discover-sheet"
      >
        <DiscoverScreenContent />
      </Box>

      <KeyboardDismissHandler />
    </Box>
  );
};

const KeyboardDismissHandler = memo(function KeyboardDismissHandler() {
  const isFocused = useIsFocused();
  const isSearching = useDiscoverSearchQueryStore(state => state.isSearching);

  useEffect(() => {
    if (!isFocused && isSearching) {
      Keyboard.dismiss();
    }
  }, [isFocused, isSearching]);

  return null;
});

export default function DiscoverScreen() {
  return (
    <DiscoverScreenProvider>
      <Content />
    </DiscoverScreenProvider>
  );
}
