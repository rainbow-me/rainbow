import React, { memo, useEffect } from 'react';
import { Keyboard, Platform } from 'react-native';

import { useIsFocused } from '@react-navigation/native';
import Animated, { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDiscoverSearchQueryStore } from '@/__swaps__/screens/Swap/resources/search/searchV2';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { ContactAvatar } from '@/components/contacts';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { DiscoverScreenContent } from '@/components/Discover/DiscoverScreenContent';
import { DiscoverScreenProvider, useDiscoverScreenContext } from '@/components/Discover/DiscoverScreenContext';
import { DiscoverSearchBar } from '@/components/Discover/DiscoverSearchBar';
import { Navbar, navbarHeight } from '@/components/navbar/Navbar';
import { ScrollHeaderFade } from '@/components/scroll-header-fade/ScrollHeaderFade';
import { useScrollFadeHandler } from '@/components/scroll-header-fade/useScrollFadeHandler';
import { Box, globalColors, TextIcon, useColorMode } from '@/design-system';
import * as i18n from '@/languages';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { useAccountProfileInfo } from '@/state/wallets/walletsStore';
import { THICK_BORDER_WIDTH } from '@/styles/constants';
import safeAreaInsetValues from '@/utils/safeAreaInsetValues';

import { PullToRefresh } from './Airdrops/AirdropsSheet';

export const DiscoverScreen = () => {
  return (
    <DiscoverScreenProvider>
      <Content />
    </DiscoverScreenProvider>
  );
};

const Content = () => {
  const { isDarkMode } = useColorMode();
  const { top: topInset } = useSafeAreaInsets();
  const { accountSymbol, accountColor, accountImage } = useAccountProfileInfo();
  const { scrollViewRef, onTapSearch } = useDiscoverScreenContext();
  const isSearching = useDiscoverSearchQueryStore(state => state.isSearching);

  const backgroundColor = isDarkMode ? globalColors.grey100 : '#FBFCFD';
  const headerFadeTopInset = topInset + navbarHeight;
  const scrollOffset = useSharedValue(0);

  const onScroll = useScrollFadeHandler(scrollOffset);

  return (
    <Box height="full" style={{ flex: 1, backgroundColor }}>
      <Box paddingTop={{ custom: topInset }}>
        {isSearching ? (
          <DiscoverSearchBar />
        ) : (
          <Navbar
            leftComponent={
              <ButtonPressAnimation onPress={onChangeWallet} scaleTo={0.8} overflowMargin={50}>
                {accountImage ? (
                  <ImageAvatar image={accountImage} marginRight={10} size="header" />
                ) : (
                  <ContactAvatar color={accountColor} marginRight={10} size="small" value={accountSymbol} />
                )}
              </ButtonPressAnimation>
            }
            rightComponent={
              <ButtonPressAnimation onPress={onTapSearch} scaleTo={0.8} overflowMargin={50} testID="discover-search-icon">
                <Box
                  background="fillSecondary"
                  width={36}
                  height={36}
                  borderRadius={18}
                  alignItems="center"
                  justifyContent="center"
                  borderWidth={THICK_BORDER_WIDTH}
                  borderColor="buttonStroke"
                >
                  <TextIcon size="icon 16px" color="label" weight="heavy" containerSize={36}>
                    {'􀊫'}
                  </TextIcon>
                </Box>
              </ButtonPressAnimation>
            }
            testID="discover-header"
            title={i18n.t(i18n.l.discover.search.discover)}
          />
        )}
      </Box>

      <Box
        as={Animated.ScrollView}
        automaticallyAdjustsScrollIndicatorInsets={false}
        onScroll={onScroll}
        ref={scrollViewRef}
        refreshControl={Platform.OS === 'ios' ? <PullToRefresh /> : undefined}
        removeClippedSubviews
        scrollEnabled={!isSearching}
        scrollIndicatorInsets={{ bottom: safeAreaInsetValues.bottom + 167, top: 16 }}
        testID="discover-sheet"
      >
        <DiscoverScreenContent />
      </Box>

      {!isSearching ? <ScrollHeaderFade color={backgroundColor} scrollOffset={scrollOffset} topInset={headerFadeTopInset} /> : null}

      <KeyboardDismissHandler />
    </Box>
  );
};

const KeyboardDismissHandler = memo(function KeyboardDismissHandler() {
  const isFocused = useIsFocused();
  const isSearching = useDiscoverSearchQueryStore(state => state.isSearching);

  useEffect(() => {
    const shouldDismiss = !isFocused && isSearching;
    if (shouldDismiss) Keyboard.dismiss();
  }, [isFocused, isSearching]);

  return null;
});

function onChangeWallet(): void {
  Navigation.handleAction(Routes.CHANGE_WALLET_SHEET);
}
