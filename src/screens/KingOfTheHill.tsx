import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { ButtonPressAnimation } from '@/components/animations';
import { ContactAvatar } from '@/components/contacts';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { KingOfTheHillContent } from '@/components/king-of-the-hill/KingOfTheHillContent';
import { Navbar } from '@/components/navbar/Navbar';
import { Text, useColorMode } from '@/design-system';
import { abbreviateNumber } from '@/helpers/utilities';
import { usePrevious } from '@/hooks';
import * as i18n from '@/languages';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { useAirdropsStore } from '@/state/claimables/airdropsStore';
import { useKingOfTheHillStore } from '@/state/kingOfTheHill/kingOfTheHillStore';
import { useNavigationStore } from '@/state/navigation/navigationStore';
import { useAccountProfileInfo } from '@/state/wallets/walletsStore';
import { useIsFocused } from '@react-navigation/native';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

export const KingOfTheHillScreen = () => {
  const { isDarkMode } = useColorMode();
  const { accountSymbol, accountColor, accountImage } = useAccountProfileInfo();
  const airdropsCount = useAirdropsStore(state => state.getNumberOfAirdrops() || 0);
  const scrollY = useSharedValue(0);
  const [backgroundColor, setBackgroundColor] = useState<string | null>(null);

  const onChangeWallet = useCallback(() => {
    Navigation.handleAction(Routes.CHANGE_WALLET_SHEET);
  }, []);

  const handleColorExtracted = useCallback((color: string | null) => {
    setBackgroundColor(color);
  }, []);

  return (
    <>
      <KeyboardDismissHandler />
      <SyncStoreEnabled />

      <View style={{ flex: 1, backgroundColor: backgroundColor || 'transparent' }}>
        <Navbar
          scrollY={scrollY}
          testID="koth-header"
          title={i18n.t(i18n.l.king_of_hill.title)}
          floating
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
                Navigation.handleAction(Routes.AIRDROPS_SHEET);
              }}
              scaleTo={0.8}
              overflowMargin={50}
              testID="koth-search-icon"
            >
              <View
                style={[
                  styles.airdropButton,
                  {
                    backgroundColor: isDarkMode ? 'rgba(245, 248, 255, 0.12)' : 'rgba(9, 17, 31, 0.05)',
                    borderColor: isDarkMode ? 'rgba(245, 248, 255, 0.04)' : 'rgba(9, 17, 31, 0.04)',
                  },
                ]}
              >
                <Text color="labelSecondary" size="icon 14px" weight="bold">
                  {'􀑉'}
                </Text>
                <Text size="icon 17px" color="labelSecondary" weight="heavy">
                  {abbreviateNumber(airdropsCount)}
                </Text>
              </View>
            </ButtonPressAnimation>
          }
        />

        <KingOfTheHillContent scrollY={scrollY} onColorExtracted={handleColorExtracted} />
      </View>
    </>
  );
};

const SyncStoreEnabled = memo(function SyncStoreEnabled() {
  const activeSwipeRoute = useNavigationStore(state => state.activeSwipeRoute);
  const previousActiveSwipeRoute = usePrevious(activeSwipeRoute);

  if (activeSwipeRoute === Routes.KING_OF_THE_HILL && previousActiveSwipeRoute !== Routes.KING_OF_THE_HILL) {
    useKingOfTheHillStore.setState({
      enabled: true,
    });
  }
  return null;
});

const KeyboardDismissHandler = memo(function KeyboardDismissHandler() {
  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused) {
      Keyboard.dismiss();
    }
  }, [isFocused]);

  return null;
});

const styles = StyleSheet.create({
  airdropButton: {
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 10,
    gap: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: THICK_BORDER_WIDTH,
    flexDirection: 'row',
  },
});
