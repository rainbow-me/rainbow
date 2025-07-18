import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { ButtonPressAnimation } from '@/components/animations';
import { ContactAvatar } from '@/components/contacts';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { KingOfTheHillContent } from '@/components/king-of-the-hill/KingOfTheHillContent';
import { Navbar } from '@/components/navbar/Navbar';
import { globalColors, TextIcon, useColorMode } from '@/design-system';
import * as i18n from '@/languages';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { useAirdropsStore } from '@/state/claimables/airdropsStore';
import { useAccountProfileInfo } from '@/state/wallets/walletsStore';
import { useIsFocused } from '@react-navigation/native';
import React, { memo, useEffect } from 'react';
import { Dimensions, Keyboard, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { useSharedValue } from 'react-native-reanimated';

export const KingOfTheHill = () => {
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

  return (
    <View style={{ flex: 1, backgroundColor: backgroundColor || (isDarkMode ? globalColors.grey100 : '#FBFCFD') }}>
      {/* Hill background image - positioned behind everything */}
      <View
        style={{
          position: 'absolute',
          top: 120,
          left: (screenWidth - hillWidth) / 2,
          width: hillWidth,
          height: hillWidth * 0.7,
          zIndex: 0,
        }}
      >
        <FastImage
          source={require('@/components/king-of-the-hill/hill.png')}
          style={{ width: '100%', height: '100%' }}
          resizeMode="contain"
        />
      </View>
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
              style={{
                backgroundColor: isDarkMode ? 'rgba(245, 248, 255, 0.12)' : 'rgba(9, 17, 31, 0.05)',
                height: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: THICK_BORDER_WIDTH,
                borderColor: isDarkMode ? 'rgba(245, 248, 255, 0.04)' : 'rgba(9, 17, 31, 0.04)',
              }}
            >
              <TextIcon size="icon 16px" color="label" weight="heavy" containerSize={36 + `${airdropsCount}`.length * 18}>
                {/* TODO android use gift.svg */}
                {'􀑉'} {airdropsCount}
              </TextIcon>
            </View>
          </ButtonPressAnimation>
        }
        scrollY={scrollY}
        testID={'koth-header'}
        title={i18n.t(i18n.l.king_of_hill.title)}
        floating
      />

      <KingOfTheHillContent scrollY={scrollY} onColorExtracted={handleColorExtracted} />

      <KeyboardDismissHandler />
    </View>
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
