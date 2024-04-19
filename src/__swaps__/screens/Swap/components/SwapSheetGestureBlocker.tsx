import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { Box } from '@/design-system';
import { IS_IOS } from '@/env';
import { NavigationSteps, useSwapContext } from '../providers/swap-provider';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';

export const SwapSheetGestureBlocker = ({
  children,
  preventScrollViewDismissal = true,
}: {
  children: React.ReactNode;
  preventScrollViewDismissal?: boolean;
}) => {
  const { reviewProgress, inputProgress, outputProgress } = useSwapContext();
  const [enabled, setEnabled] = useState<boolean>(false);

  useAnimatedReaction(
    () => ({
      reviewProgress: reviewProgress.value,
      inputProgress: inputProgress.value,
      outputProgress: outputProgress.value,
    }),
    current => {
      runOnJS(setEnabled)(
        current.reviewProgress === NavigationSteps.SHOW_REVIEW ||
          current.inputProgress !== NavigationSteps.INPUT_ELEMENT_FOCUSED ||
          current.outputProgress !== NavigationSteps.INPUT_ELEMENT_FOCUSED
      );
    }
  );

  return IS_IOS ? (
    // @ts-expect-error
    <PanGestureHandler enabled={enabled}>
      <View style={{ height: '100%', width: '100%' }}>
        <>
          {children}
          {preventScrollViewDismissal && (
            <Box height={{ custom: 0 }} pointerEvents="none" position="absolute" style={{ opacity: 0, zIndex: -100 }}>
              <ScrollView scrollEnabled={false} />
            </Box>
          )}
        </>
      </View>
    </PanGestureHandler>
  ) : (
    <>{children}</>
  );
};
