import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { ButtonPressAnimation } from '@/components/animations';
import { ContactAvatar } from '@/components/contacts';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { KingOfTheHillContent } from '@/components/king-of-the-hill/KingOfTheHillContent';
import { Navbar } from '@/components/navbar/Navbar';
import { Box, globalColors, TextIcon, useColorMode } from '@/design-system';
import * as i18n from '@/languages';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { useAccountProfileInfo } from '@/state/wallets/walletsStore';
import { safeAreaInsetValues } from '@/utils';
import { useIsFocused } from '@react-navigation/native';
import React, { memo, useEffect } from 'react';
import { Keyboard } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const KingOfTheHill = () => {
  const { isDarkMode } = useColorMode();
  const { top: topInset } = useSafeAreaInsets();
  const { accountSymbol, accountColor, accountImage } = useAccountProfileInfo();

  const scrollY = useSharedValue(0);

  const onChangeWallet = React.useCallback(() => {
    Navigation.handleAction(Routes.CHANGE_WALLET_SHEET);
  }, []);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const airdropsCount = 4;

  return (
    <Box height="full" style={{ flex: 1, backgroundColor: isDarkMode ? globalColors.grey100 : '#FBFCFD' }}>
      <Box paddingTop={{ custom: topInset }}>
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
            <ButtonPressAnimation
              onPress={() => {
                // todo
              }}
              scaleTo={0.8}
              overflowMargin={50}
              testID="koth-search-icon"
            >
              <Box
                background="fillSecondary"
                height={36}
                borderRadius={18}
                alignItems="center"
                justifyContent="center"
                borderWidth={THICK_BORDER_WIDTH}
                borderColor="buttonStroke"
              >
                <TextIcon size="icon 16px" color="label" weight="heavy" containerSize={36 + `${airdropsCount}`.length * 18}>
                  {/* TODO android use gift.svg */}
                  {'􀑉'} {airdropsCount}
                </TextIcon>
              </Box>
            </ButtonPressAnimation>
          }
          testID={'koth-header'}
          title={i18n.t(i18n.l.king_of_hill.title)}
        />
      </Box>
      <Box
        // ref={scrollViewRef}
        as={Animated.ScrollView}
        automaticallyAdjustsScrollIndicatorInsets={false}
        onScroll={scrollHandler}
        // scrollEnabled={!isSearching}
        // refreshControl={IS_IOS ? <PullToRefresh /> : undefined}
        removeClippedSubviews
        scrollIndicatorInsets={{ bottom: safeAreaInsetValues.bottom + 167 }}
        testID="koth-sheet"
      >
        <KingOfTheHillContent />
      </Box>

      <KeyboardDismissHandler />
    </Box>
  );
};

const KeyboardDismissHandler = memo(function KeyboardDismissHandler() {
  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused) {
      Keyboard.dismiss();
    }
  }, [isFocused]);

  return null;
});
