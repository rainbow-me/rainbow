import { ButtonPressAnimation } from '@/components/animations';
import { ContactAvatar } from '@/components/contacts';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { Navbar } from '@/components/navbar/Navbar';
import { usePendingTransactionWatcher } from '@/hooks/usePendingTransactionWatcher';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { useAccountAddress, useAccountProfileInfo } from '@/state/wallets/walletsStore';
import { useTheme } from '@/theme';
import React, { memo } from 'react';
import { View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { ActivityList } from '../components/activity-list';

export function ActivitySheetScreen() {
  const { accountSymbol, accountColor, accountImage } = useAccountProfileInfo();
  const scrollY = useSharedValue(0);
  const { colors } = useTheme();

  return (
    <View style={{ backgroundColor: colors.white, flex: 1 }} testID="king-of-the-hill-profile-screen">
      <Navbar
        floating
        topInset={10}
        scrollY={scrollY}
        title="Activity"
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
        <ActivityList scrollY={scrollY} paddingTopForNavBar />
      </View>
      <PendingTransactionWatcher />
    </View>
  );
}

function onChangeWallet(): void {
  Navigation.handleAction(Routes.CHANGE_WALLET_SHEET);
}

const PendingTransactionWatcher = memo(function PendingTransactionWatcher() {
  const accountAddress = useAccountAddress();
  usePendingTransactionWatcher({ address: accountAddress });
  return null;
});
