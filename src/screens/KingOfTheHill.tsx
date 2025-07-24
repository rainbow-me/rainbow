import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { ButtonPressAnimation } from '@/components/animations';
import { ContactAvatar } from '@/components/contacts';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';
import { KingOfTheHillContent } from '@/components/king-of-the-hill/KingOfTheHillContent';
import { Navbar } from '@/components/navbar/Navbar';
import { globalColors, Text, useColorMode } from '@/design-system';
import { abbreviateNumber } from '@/helpers/utilities';
import { usePrevious } from '@/hooks';
import * as i18n from '@/languages';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { useAirdropsStore } from '@/state/claimables/airdropsStore';
import { useKingOfTheHillStore } from '@/state/kingOfTheHill/kingOfTheHillStore';
import { useNavigationStore } from '@/state/navigation/navigationStore';
import { useAccountProfileInfo } from '@/state/wallets/walletsStore';
import MaskedView from '@react-native-masked-view/masked-view';
import { useIsFocused } from '@react-navigation/native';
import React, { memo, useEffect } from 'react';
import { Dimensions, Keyboard, StyleSheet, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { interpolate, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

export const KingOfTheHillScreen = () => {
  const { isDarkMode } = useColorMode();
  const { accountSymbol, accountColor, accountImage } = useAccountProfileInfo();
  const getNumberOfAirdrops = useAirdropsStore(state => state.getNumberOfAirdrops);
  const scrollY = useSharedValue(0);
  const [backgroundColor, setBackgroundColor] = React.useState<string | null>(null);

  const onChangeWallet = React.useCallback(() => {
    Navigation.handleAction(Routes.CHANGE_WALLET_SHEET);
  }, []);

  const airdropsCount = getNumberOfAirdrops() || 0;

  const handleColorExtracted = React.useCallback((color: string | null) => {
    setBackgroundColor(color);
  }, []);

  const { width: screenWidth } = Dimensions.get('window');
  const hillWidth = screenWidth * 0.9;
  const hillHeight = hillWidth * 0.7;
  const hillImageHiddenByScrollY = 100;

  const hillAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, hillImageHiddenByScrollY], [1, 0], 'clamp');
    const translateY = interpolate(scrollY.value, [0, hillImageHiddenByScrollY], [0, -30], 'clamp');
    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  return (
    <>
      <KeyboardDismissHandler />
      <SyncStoreEnabled />

      <View style={{ flex: 1, backgroundColor: backgroundColor || (isDarkMode ? globalColors.grey100 : '#FBFCFD') }}>
        {/* hill background image */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 120,
              left: (screenWidth - hillWidth) / 2,
              width: hillWidth,
              height: hillHeight,
              zIndex: 0,
            },
            hillAnimatedStyle,
          ]}
        >
          <FastImage source={require('@/components/king-of-the-hill/hill.png')} style={{ width: hillWidth, height: hillHeight }} />
        </Animated.View>
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
          scrollY={scrollY}
          testID={'koth-header'}
          title={i18n.t(i18n.l.king_of_hill.title)}
          floating
        />

        <KingOfTheHillContent scrollY={scrollY} onColorExtracted={handleColorExtracted} />

        {/* launch button */}
        <View style={styles.launchButtonPosition}>
          <ButtonPressAnimation
            onPress={() => {
              Navigation.handleAction(Routes.TOKEN_LAUNCHER_SCREEN);
            }}
          >
            <View
              style={[
                styles.launchButton,
                {
                  shadowColor: isDarkMode ? '#000' : 'rgba(0,0,0,0.4)',
                },
              ]}
            >
              <GradientBorderView
                borderGradientColors={['#FFEB3B', '#FFA500']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                borderRadius={28}
                borderWidth={3}
                backgroundColor={'transparent'}
                // leaving inline position styles so its easier to see next to the usage
                style={{
                  height: 52,
                  width: 150,
                }}
              >
                <View style={styles.launchButtonContent}>
                  <LinearGradient
                    colors={['#EBAF09', '#FFC800']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.launchButtonGradient}
                  >
                    <MaskedView
                      maskElement={
                        <View style={styles.launchButtonTextContainer}>
                          <Text color="accent" size="20pt" weight="black" style={{ marginTop: -1 }}>
                            + Launch
                          </Text>
                        </View>
                      }
                    >
                      <LinearGradient
                        colors={['#3D1E0A', '#7A600A']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        // leaving inline position styles so its easier to see next to the usage
                        // this is hard-coded based on text width
                        style={{ height: 24, width: 100 }}
                      />
                    </MaskedView>
                  </LinearGradient>
                </View>
              </GradientBorderView>
            </View>
          </ButtonPressAnimation>
        </View>
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

  launchButtonPosition: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    zIndex: 10,
  },

  launchButton: {
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 16,
  },

  // separate from launchButton so overflow hidden doesnt mess up shadow
  launchButtonContent: { borderRadius: 28, overflow: 'hidden', flex: 1 },

  launchButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  launchButtonTextContainer: { alignItems: 'center', justifyContent: 'center' },
});
