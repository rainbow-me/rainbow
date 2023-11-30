import React from 'react';
import { Page } from '@/components/layout';
import { Navbar } from '@/components/navbar/Navbar';
import Routes from '@/navigation/routesNames';
import { useNavigation } from '@/navigation';
import { Box } from '@/design-system';
import { useAccountProfile } from '@/hooks';
import { POINTS, useExperimentalFlag } from '@/config';
import config from '@/model/config';
import { ContactAvatar } from '@/components/contacts';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { ButtonPressAnimation } from '@/components/animations';
import * as i18n from '@/languages';
import { usePoints } from '@/resources/points';
import PointsContent from './content/PointsContent';
import PlaceholderContent from './content/PlaceholderContent';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { deviceUtils } from '@/utils';
import ClaimContent from './content/ClaimContent';
import ReferralContent from './content/ReferralContent';
import { PointsErrorType } from '@/graphql/__generated__/metadata';

const Swipe = createMaterialTopTabNavigator();

export default function PointsScreen() {
  const {
    accountAddress,
    accountImage,
    accountColor,
    accountSymbol,
  } = useAccountProfile();
  const pointsFullyEnabled =
    useExperimentalFlag(POINTS) || config.points_fully_enabled;
  const { navigate } = useNavigation();
  const { data } = usePoints({
    walletAddress: accountAddress,
  });

  const isOnboarded =
    data?.points?.error?.type !== PointsErrorType.NonExistingUser;

  return (
    <Box as={Page} flex={1} height="full" testID="points-screen" width="full">
      <Navbar
        hasStatusBarInset
        leftComponent={
          pointsFullyEnabled && (
            <ButtonPressAnimation
              onPress={() => navigate(Routes.CHANGE_WALLET_SHEET)}
              scaleTo={0.8}
              overflowMargin={50}
            >
              {accountImage ? (
                <ImageAvatar
                  image={accountImage}
                  marginRight={10}
                  size="header"
                />
              ) : (
                <ContactAvatar
                  color={accountColor}
                  marginRight={10}
                  size="small"
                  value={accountSymbol}
                />
              )}
            </ButtonPressAnimation>
          )
        }
        title={i18n.t(i18n.l.account.tab_points)}
      />
      {pointsFullyEnabled ? (
        isOnboarded ? (
          <PointsContent />
        ) : (
          <Swipe.Navigator
            backBehavior="history"
            initialLayout={deviceUtils.dimensions}
            initialRouteName={isOnboarded ? 'PointsContent' : 'ClaimContent'}
            screenOptions={{ swipeEnabled: true }}
            tabBarPosition="bottom"
            tabBar={() => null}
          >
            <Swipe.Screen component={ClaimContent} name="ClaimContent" />
            <Swipe.Screen component={ReferralContent} name="ReferralContent" />
            <Swipe.Screen component={PointsContent} name="PointsContent" />
          </Swipe.Navigator>
        )
      ) : (
        <PlaceholderContent />
      )}
    </Box>
  );
}
