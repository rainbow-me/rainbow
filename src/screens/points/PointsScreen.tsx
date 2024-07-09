import React, { useEffect } from 'react';
import { Page } from '@/components/layout';
import { Navbar } from '@/components/navbar/Navbar';
import Routes from '@/navigation/routesNames';
import { useNavigation } from '@/navigation';
import { Box, globalColors, useColorMode } from '@/design-system';
import { useAccountProfile } from '@/hooks';
import { ETH_REWARDS, POINTS, POINTS_NOTIFICATIONS_TOGGLE, useExperimentalFlag } from '@/config';
import { ContactAvatar } from '@/components/contacts';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { ButtonPressAnimation } from '@/components/animations';
import * as i18n from '@/languages';
import { usePoints, usePointsReferralCode } from '@/resources/points';
import { PointsContent } from './content/PointsContent';
import { PlaceholderContent } from './content/PlaceholderContent';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { deviceUtils } from '@/utils';
import { ClaimContent } from './content/ClaimContent';
import { ReferralContent } from './content/ReferralContent';
import { PointsErrorType } from '@/graphql/__generated__/metadataPOST';
import { delay } from '@/utils/delay';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { useRemoteConfig } from '@/model/remoteConfig';
import { IS_TEST } from '@/env';
import { NotificationToggleContextMenu } from './components/NotificationToggleContextMenu';
import { TAB_BAR_HEIGHT } from '@/navigation/SwipeNavigator';

export const POINTS_ROUTES = {
  CLAIM_CONTENT: 'ClaimContent',
  REFERRAL_CONTENT: 'ReferralContent',
};

const Swipe = createMaterialTopTabNavigator();
const EmptyTabBar = () => <></>;

export function PointsScreen() {
  const { isDarkMode } = useColorMode();
  const { accountAddress, accountImage, accountColor, accountSymbol } = useAccountProfile();
  const { points_enabled, points_notifications_toggle, rewards_enabled } = useRemoteConfig();
  const pointsEnabled = useExperimentalFlag(POINTS) || points_enabled || IS_TEST;
  const pointsNotificationsToggleEnabled = useExperimentalFlag(POINTS_NOTIFICATIONS_TOGGLE) || points_notifications_toggle;
  const rewardsEnabled = useExperimentalFlag(ETH_REWARDS) || rewards_enabled;
  const { navigate } = useNavigation();
  const { data } = usePoints({
    walletAddress: accountAddress,
  });
  const { data: referralCode, refetch: resetReferralCode } = usePointsReferralCode();

  const isOnboarded = data?.points?.error?.type !== PointsErrorType.NonExistingUser;

  useEffect(() => {
    if (referralCode && pointsEnabled) {
      navigate(Routes.POINTS_SCREEN);
      delay(700)
        .then(() => {
          if (!isOnboarded) {
            navigate(POINTS_ROUTES.REFERRAL_CONTENT);
          } else {
            Alert.alert(i18n.t(i18n.l.points.points.already_claimed_points));
          }
        })
        .then(() => resetReferralCode());
    }
  }, [data, isOnboarded, navigate, pointsEnabled, referralCode, resetReferralCode]);

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
          pointsEnabled && (
            <ButtonPressAnimation onPress={() => navigate(Routes.CHANGE_WALLET_SHEET)} scaleTo={0.8} overflowMargin={50}>
              {accountImage ? (
                <ImageAvatar image={accountImage} marginRight={10} size="header" />
              ) : (
                <ContactAvatar color={accountColor} marginRight={10} size="small" value={accountSymbol} />
              )}
            </ButtonPressAnimation>
          )
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
