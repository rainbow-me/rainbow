import React, { useEffect } from 'react';
import { Page } from '@/components/layout';
import { Navbar } from '@/components/navbar/Navbar';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { Box, globalColors, useColorMode } from '@/design-system';
import { ETH_REWARDS, POINTS, POINTS_NOTIFICATIONS_TOGGLE, useExperimentalFlag } from '@/config';
import { ContactAvatar } from '@/components/contacts';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { IS_TEST } from '@/env';
import { PointsErrorType } from '@/graphql/__generated__/metadataPOST';
import { WrappedAlert as Alert } from '@/helpers/alert';
import * as i18n from '@/languages';
import { useRemoteConfig } from '@/model/remoteConfig';
import { TAB_BAR_HEIGHT } from '@/navigation/SwipeNavigator';
import { usePoints, usePointsReferralCode } from '@/resources/points';
import { useAccountProfileInfo } from '@/state/wallets/walletsStore';
import { deviceUtils } from '@/utils';
import { delay } from '@/utils/delay';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { NotificationToggleContextMenu } from './components/NotificationToggleContextMenu';
import { ClaimContent } from './content/ClaimContent';
import { PlaceholderContent } from './content/PlaceholderContent';
import { PointsContent } from './content/PointsContent';
import { ReferralContent } from './content/ReferralContent';
import { ButtonPressAnimation } from '../../components/animations';

export const POINTS_ROUTES = {
  CLAIM_CONTENT: 'ClaimContent',
  REFERRAL_CONTENT: 'ReferralContent',
} as const;

const Swipe = createMaterialTopTabNavigator();
const EmptyTabBar = () => <></>;

export function PointsScreen() {
  const { isDarkMode } = useColorMode();
  const { accountAddress, accountImage, accountColor, accountSymbol } = useAccountProfileInfo();
  const { points_enabled, points_notifications_toggle, rewards_enabled } = useRemoteConfig();
  const pointsEnabled = useExperimentalFlag(POINTS) || points_enabled || IS_TEST;
  const pointsNotificationsToggleEnabled = useExperimentalFlag(POINTS_NOTIFICATIONS_TOGGLE) || points_notifications_toggle;
  const rewardsEnabled = useExperimentalFlag(ETH_REWARDS) || rewards_enabled;
  const { data } = usePoints({
    walletAddress: accountAddress,
  });
  const { data: referralCode, refetch: resetReferralCode } = usePointsReferralCode();

  const isOnboarded = data?.points?.error?.type !== PointsErrorType.NonExistingUser;

  useEffect(() => {
    if (referralCode && pointsEnabled) {
      Navigation.handleAction(Routes.POINTS_SCREEN);
      delay(700)
        .then(() => {
          if (!isOnboarded) {
            Navigation.handleAction(POINTS_ROUTES.REFERRAL_CONTENT);
          } else {
            Alert.alert(i18n.t(i18n.l.points.points.already_claimed_points));
          }
        })
        .then(() => resetReferralCode());
    }
  }, [data, isOnboarded, pointsEnabled, referralCode, resetReferralCode]);

  return (
    <Box
      as={Page}
      flex={1}
      height="full"
      style={{ backgroundColor: isDarkMode ? globalColors.grey100 : '#FBFCFD' }}
      testID="points-screen"
      width="full"
    >
      <Navbar
        hasStatusBarInset
        leftComponent={
          pointsEnabled ? (
            <ButtonPressAnimation onPress={() => Navigation.handleAction(Routes.CHANGE_WALLET_SHEET)} scaleTo={0.8} overflowMargin={50}>
              {accountImage ? (
                <ImageAvatar image={accountImage} marginRight={10} size="header" />
              ) : (
                <ContactAvatar color={accountColor} marginRight={10} size="small" value={accountSymbol} />
              )}
            </ButtonPressAnimation>
          ) : null
        }
        rightComponent={pointsNotificationsToggleEnabled ? <NotificationToggleContextMenu /> : undefined}
        title={rewardsEnabled ? i18n.t(i18n.l.account.tab_rewards) : i18n.t(i18n.l.account.tab_points)}
      />
      {/* eslint-disable-next-line no-nested-ternary */}
      {pointsEnabled ? (
        isOnboarded ? (
          <PointsContent />
        ) : (
          <Swipe.Navigator
            backBehavior="history"
            initialLayout={deviceUtils.dimensions}
            initialRouteName={POINTS_ROUTES.CLAIM_CONTENT}
            sceneContainerStyle={{ overflow: 'visible' }}
            screenOptions={{ lazy: true, swipeEnabled: false }}
            style={{ paddingBottom: TAB_BAR_HEIGHT, paddingTop: 44 }}
            tabBarPosition="bottom"
            tabBar={EmptyTabBar}
          >
            <Swipe.Screen component={ClaimContent} name={POINTS_ROUTES.CLAIM_CONTENT} />
            <Swipe.Screen component={ReferralContent} name={POINTS_ROUTES.REFERRAL_CONTENT} />
          </Swipe.Navigator>
        )
      ) : (
        <PlaceholderContent />
      )}
    </Box>
  );
}
