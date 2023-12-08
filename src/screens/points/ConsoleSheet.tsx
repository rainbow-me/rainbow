/* eslint-disable no-nested-ternary */
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { Box, Inset, globalColors } from '@/design-system';
import { RouteProp, useRoute } from '@react-navigation/native';

import { RainbowPointsFlowSteps, SCREEN_BOTTOM_INSET } from './constants';
import { TypingAnimation } from './contexts/AnimationContext';
import { usePointsProfileContext } from './contexts/PointsProfileContext';
import { Initialize } from './content/console/initialize';
import { Calculate } from './content/console/calculate';
import { Share } from './content/console/share';
import { Review } from './content/console/review';

type ConsoleSheetParams = {
  ConsoleSheet: {
    referralCode?: string;
  };
};

export const ConsoleSheet = () => {
  const { params } = useRoute<RouteProp<ConsoleSheetParams, 'ConsoleSheet'>>();
  const referralCode = params?.referralCode;

  const { animationKey, setReferralCode } = usePointsProfileContext();

  useEffect(() => {
    setReferralCode(referralCode);
  }, [setReferralCode, referralCode]);

  return (
    <Inset bottom={{ custom: SCREEN_BOTTOM_INSET }}>
      <Box
        height="full"
        justifyContent="flex-end"
        paddingHorizontal="16px"
        style={{ gap: 24 }}
        width="full"
      >
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
  }
};

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: '#191A1C',
    borderColor: 'rgba(245, 248, 255, 0.06)',
    borderCurve: 'continuous',
    borderRadius: 28,
    borderWidth: 1.5,
    height: 504,
    gap: 45,
    paddingHorizontal: 30,
    paddingVertical: 45,
    width: '100%',
    zIndex: -1,
  },
});
