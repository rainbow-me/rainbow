import { useIsFocused } from '@react-navigation/native';
import React, { memo, useEffect } from 'react';
import { Keyboard } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { DiscoverScreenContent } from '@/components/Discover/DiscoverScreenContent';
import DiscoverScreenProvider, { useDiscoverScreenContext } from '@/components/Discover/DiscoverScreenContext';
import { ButtonPressAnimation } from '@/components/animations';
import { ContactAvatar } from '@/components/contacts';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { Navbar } from '@/components/navbar/Navbar';
import { Box, globalColors, TextIcon, useColorMode } from '@/design-system';
import { IS_IOS } from '@/env';
import * as i18n from '@/languages';
import { useDiscoverSearchQueryStore } from '@/__swaps__/screens/Swap/resources/search/searchV2';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { safeAreaInsetValues } from '@/utils';
import { PullToRefresh } from './Airdrops/AirdropsSheet';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { DiscoverSearchBar } from '@/components/Discover/DiscoverSearchBar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccountProfileInfo } from '@/state/wallets/walletsStore';

const Content = () => {
  const { isDarkMode } = useColorMode();
  const { top: topInset } = useSafeAreaInsets();
  const { accountSymbol, accountColor, accountImage } = useAccountProfileInfo();

  const { scrollViewRef, onTapSearch } = useDiscoverScreenContext();
  const isSearching = useDiscoverSearchQueryStore(state => state.isSearching);
  const scrollY = useSharedValue(0);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      useDiscoverSearchQueryStore.setState({ isSearching: false });
    }
  }, [isFocused]);

  const onChangeWallet = React.useCallback(() => {
    Navigation.handleAction(Routes.CHANGE_WALLET_SHEET);
  }, []);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      scrollY.value = event.contentOffset.y;
    },
  });

  return (
    <Box height="full" style={{ flex: 1, backgroundColor: isDarkMode ? globalColors.grey100 : '#FBFCFD' }}>
      <Box paddingTop={{ custom: topInset }}>
        {isSearching && <DiscoverSearchBar />}
        {!isSearching && (
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
            testID={'discover-header'}
            title={i18n.t(i18n.l.discover.search.discover)}
          />
        )}
      </Box>
      <Box
        ref={scrollViewRef}
        as={Animated.ScrollView}
        automaticallyAdjustsScrollIndicatorInsets={false}
        onScroll={scrollHandler}
        scrollEnabled={!isSearching}
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
