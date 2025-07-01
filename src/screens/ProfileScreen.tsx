import React, { memo } from 'react';
import { View } from 'react-native';
import { ActivityList } from '../components/activity-list';
import { Page } from '../components/layout';
import Navigation from '@/navigation/Navigation';
import { ButtonPressAnimation } from '@/components/animations';
import { CandlestickChart, DEFAULT_CANDLESTICK_CONFIG } from '@/components/candlestick-charts/CandlestickChart';
import Routes from '@/navigation/routesNames';
import styled from '@/styled-thing';
import { position } from '@/styles';
import { Navbar } from '@/components/navbar/Navbar';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { ContactAvatar } from '@/components/contacts';
import { useExperimentalFlag } from '@/config';
import { usePendingTransactionWatcher } from '@/hooks/usePendingTransactionWatcher';
import { useAccountAddress, useAccountProfileInfo } from '@/state/wallets/walletsStore';
import { useSharedValue } from 'react-native-reanimated';

const ProfileScreenPage = styled(Page)({
  ...position.sizeAsObject('100%'),
  flex: 1,
});

export default function ProfileScreen() {
  const { accountSymbol, accountColor, accountImage } = useAccountProfileInfo();
  const enableCandlestickCharts = useExperimentalFlag('Candlestick Charts');
  const isChartGestureActive = useSharedValue(false);

  return (
    <ProfileScreenPage
      color={enableCandlestickCharts ? DEFAULT_CANDLESTICK_CONFIG.chart.backgroundColor : undefined}
      testID="profile-screen"
    >
      <Navbar
        title="Activity"
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
      />

      {enableCandlestickCharts ? (
        <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center', paddingBottom: 100 }}>
          <CandlestickChart isChartGestureActive={isChartGestureActive} />
        </View>
      ) : (
        <ActivityList />
      )}
      <PendingTransactionWatcher />
    </ProfileScreenPage>
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
