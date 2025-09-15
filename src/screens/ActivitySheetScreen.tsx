import { ButtonPressAnimation } from '@/components/animations';
import { ContactAvatar } from '@/components/contacts';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { Navbar } from '@/components/navbar/Navbar';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { useAccountProfileInfo } from '@/state/wallets/walletsStore';
import { useTheme } from '@/theme';
import React from 'react';
import { View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { ActivityList } from '../components/activity-list';
import { IS_ANDROID } from '@/env';
import * as i18n from '@/languages';

export function ActivitySheetScreen() {
  const { accountSymbol, accountColor, accountImage, accountAddress } = useAccountProfileInfo();
  const scrollY = useSharedValue(0);
  const { colors } = useTheme();

  return (
    <View
      style={{
        backgroundColor: colors.white,
        flex: 1,
        // android border radius
        ...(IS_ANDROID && {
          borderTopRightRadius: 40,
          borderTopLeftRadius: 40,
          overflow: 'hidden',
        }),
      }}
      testID="king-of-the-hill-profile-screen"
    >
      <Navbar
        floating
        topInset={10}
        scrollY={scrollY}
        title={i18n.t(i18n.l.activity_list.title)}
        leftComponent={
          <ButtonPressAnimation onPress={onChangeWallet} scaleTo={0.8} overflowMargin={50}>
            {accountImage ? (
              <ImageAvatar image={accountImage} marginRight={10} size="header" />
            ) : (
              <ContactAvatar color={accountColor} marginRight={10} size="small" value={accountSymbol} />
            )}
          </ButtonPressAnimation>
        }
      />

      <View style={{ flex: 1 }}>
        <ActivityList key={accountAddress} scrollY={scrollY} paddingTopForNavBar />
      </View>
    </View>
  );
}

function onChangeWallet(): void {
  Navigation.handleAction(Routes.CHANGE_WALLET_SHEET);
}
