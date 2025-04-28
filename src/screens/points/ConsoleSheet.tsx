import React, { useCallback, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { Box, Inset, globalColors } from '@/design-system';
import { RouteProp, useFocusEffect, useRoute } from '@react-navigation/native';
import { analytics } from '@/analytics';

import { RainbowPointsFlowSteps, SCREEN_BOTTOM_INSET } from './constants';
import { TypingAnimation } from './contexts/AnimationContext';
import { usePointsProfileContext } from './contexts/PointsProfileContext';
import { Initialize } from './content/console/initialize';
import { Calculate } from './content/console/calculate';
import { Share } from './content/console/share';
import { Review } from './content/console/review';
import { ViewWeeklyEarnings } from './content/console/view-weekly-earnings';
import { RequireWalletBalance } from './content/console/require-wallet-balance';
import Routes from '@/navigation/routesNames';
import { RootStackParamList } from '@/navigation/types';

export const ConsoleSheet = () => {
  const { params } = useRoute<RouteProp<RootStackParamList, typeof Routes.CONSOLE_SHEET>>();
  const referralCode = params?.referralCode;
  const deeplinked = params?.deeplinked ?? false;
  const viewWeeklyEarnings = params?.viewWeeklyEarnings ?? false;

  const { animationKey, setReferralCode, setProfile, setAnimationKey, setStep, setIntent, setDeeplinked } = usePointsProfileContext();

  useEffect(() => {
    if (viewWeeklyEarnings) return;

    setReferralCode(referralCode);
    setDeeplinked(deeplinked);
  }, [setReferralCode, referralCode, setDeeplinked, deeplinked, viewWeeklyEarnings]);

  useEffect(() => {
    if (viewWeeklyEarnings) {
      setStep(RainbowPointsFlowSteps.ViewWeeklyEarnings);
      return;
    }

    setProfile(undefined);
    setAnimationKey(0);
    setStep(RainbowPointsFlowSteps.Initialize);
    setIntent(undefined);
  }, [viewWeeklyEarnings, setProfile, setAnimationKey, setStep, setIntent]);

  useFocusEffect(
    useCallback(() => {
      if (viewWeeklyEarnings) {
        analytics.track(analytics.event.pointsViewedWeeklyEarnings);
        return;
      }

      analytics.track(analytics.event.pointsViewedOnboardingSheet);
    }, [viewWeeklyEarnings])
  );

  return (
    <Inset bottom={{ custom: SCREEN_BOTTOM_INSET }}>
      <Box height="full" justifyContent="flex-end" paddingHorizontal="16px" style={{ gap: 24 }} width="full">
        <Animated.View style={styles.sheet}>
          <Box
            borderRadius={5}
            height={{ custom: 5 }}
            position="absolute"
            style={{
              alignSelf: 'center',
              backgroundColor: globalColors.white50,
            }}
            top={{ custom: 6 }}
            width={{ custom: 36 }}
          />
          <TypingAnimation key={animationKey}>
            <ClaimFlow />
          </TypingAnimation>
        </Animated.View>
      </Box>
    </Inset>
  );
};

const ClaimFlow = () => {
  const { step } = usePointsProfileContext();
  switch (step) {
    default:
    case RainbowPointsFlowSteps.Initialize:
      return <Initialize />;
    case RainbowPointsFlowSteps.CalculatePoints:
      return <Calculate />;
    case RainbowPointsFlowSteps.Share:
      return <Share />;
    case RainbowPointsFlowSteps.Review:
      return <Review />;
    case RainbowPointsFlowSteps.ViewWeeklyEarnings:
      return <ViewWeeklyEarnings />;
    case RainbowPointsFlowSteps.RequireWalletBalance:
      return <RequireWalletBalance />;
  }
};

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: '#191A1C',
    borderColor: 'rgba(245, 248, 255, 0.06)',
    borderCurve: 'continuous',
    borderRadius: 28,
    borderWidth: 1.5,
    height: 580,
    gap: 45,
    paddingHorizontal: 30,
    paddingTop: 45,
    paddingBottom: 16,
    width: '100%',
    zIndex: -1,
  },
});
