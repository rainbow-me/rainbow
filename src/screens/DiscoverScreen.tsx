import React, { useEffect } from 'react';
import { Keyboard } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Box } from '@/design-system';
import { Page } from '@/components/layout';
import { Navbar } from '@/components/navbar/Navbar';
import DiscoverScreenContent from '@/components/Discover/DiscoverScreenContent';
import { ButtonPressAnimation } from '@/components/animations';
import { ContactAvatar } from '@/components/contacts';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { useAccountProfile } from '@/hooks';
import Routes from '@/navigation/routesNames';
import { useNavigation } from '@/navigation';
import { safeAreaInsetValues } from '@/utils';
import * as i18n from '@/languages';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import DiscoverScreenProvider, { useDiscoverScreenContext } from '@/components/Discover/DiscoverScreenContext';

export let discoverScrollToTopFnRef: () => number | null = () => null;

const Content = () => {
  const { navigate } = useNavigation();
  const isFocused = useIsFocused();
  const { accountSymbol, accountColor, accountImage } = useAccountProfile();

  const { isSearching, scrollToTop, scrollViewRef } = useDiscoverScreenContext();
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
    if (isSearching && !isFocused) {
      Keyboard.dismiss();
    }
  }, [isFocused, isSearching]);

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
        removeClippedSubviews
        scrollIndicatorInsets={{ bottom: safeAreaInsetValues.bottom + 167 }}
        testID="discover-sheet"
      >
        <DiscoverScreenContent />
      </Box>
    </Box>
  );
};

export default function DiscoverScreen() {
  return (
    <DiscoverScreenProvider>
      <Content />
    </DiscoverScreenProvider>
  );
}
