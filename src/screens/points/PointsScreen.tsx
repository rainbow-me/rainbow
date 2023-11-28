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
import TestContent from './content/TestContent';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { deviceUtils } from '@/utils';
import ClaimContent from './content/ClaimContent';
import ReferralCodeContent from './content/ReferralCodeContent';
import { IS_ANDROID } from '@/env';
import { TAB_BAR_HEIGHT } from '@/navigation/SwipeNavigator';

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
  const { data, isFetching, dataUpdatedAt } = usePoints({
    walletAddress: accountAddress,
  });

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
        <Swipe.Navigator
          initialLayout={deviceUtils.dimensions}
          initialRouteName="ReferralCodeContent"
          screenOptions={{ swipeEnabled: false }}
          // tabBar={() => (
          //   <Box
          //     height={{ custom: TAB_BAR_HEIGHT }}
          //     position="absolute"
          //     bottom="0px"
          //   />
          // )}
          tabBarPosition="bottom"
          tabBar={() => null}
        >
          <Swipe.Screen
            component={PointsContent}
            // initialParams={{ isFirstWallet, userData }}
            name="PointsContent"
            // listeners={{
            //   focus: () => {
            //     setScrollEnabled(true);
            //   },
            // }}
          />
          <Swipe.Screen
            component={ClaimContent}
            // initialParams={{ isFirstWallet, userData }}
            name="ClaimContent"
            // listeners={{
            //   focus: () => {
            //     setScrollEnabled(true);
            //   },
            // }}
          />
          <Swipe.Screen
            component={ReferralCodeContent}
            // initialParams={{ isFirstWallet, userData }}
            name="ReferralCodeContent"
            // listeners={{
            //   focus: () => {
            //     setScrollEnabled(true);
            //   },
            // }}
          />
          <Swipe.Screen
            component={() => (
              <Box
                as={ButtonPressAnimation}
                onPress={() => navigate('NFTOffersSheet')}
                background="green"
                width="full"
                height="full"
              />
            )}
            // initialParams={{ type }}
            name="test2"
            // listeners={{
            //   focus: () => {
            //     setScrollEnabled(false);
            //   },
            // }}
          />
        </Swipe.Navigator>
      ) : (
        <PlaceholderContent />
      )}
      {/* <TestContent /> */}
    </Box>
  );
}
