import { useIsFocused } from '@react-navigation/native';
import React, { useMemo, useRef } from 'react';
import { findNodeHandle, NativeModules, Platform } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeArea } from 'react-native-safe-area-context';
// eslint-disable-next-line import/no-unresolved
import SlackBottomSheet from 'react-native-slack-bottom-sheet';

import BottomSheet from 'reanimated-bottom-sheet';
import DiscoverSheetContent from './DiscoverSheetContent';
import DiscoverSheetContext from './DiscoverSheetContext';

// eslint-disable-next-line import/no-named-as-default-member
const { SpringUtils } = Animated;

const discoverSheetSpring = SpringUtils.makeConfigFromBouncinessAndSpeed({
  ...SpringUtils.makeDefaultConfig(),
  bounciness: 0,
  mass: 1,
  overshootClamping: false,
  restDisplacementThreshold: 0.99,
  restSpeedThreshold: 100,
  speed: 18,
  toss: 6,
});

export default function DiscoverSheet() {
  const insets = useSafeArea();
  const isFocused = useIsFocused();
  const ref = useRef();
  const value = useMemo(
    () => ({
      jumpToShort() {
        const screen = findNodeHandle(ref.current);
        if (screen) {
          NativeModules.ModalView.jumpTo(false, screen);
        }
      },
    }),
    []
  );

  // noinspection JSConstructorReturnsPrimitive
  return (
    <DiscoverSheetContext.Provider value={value}>
      {Platform.OS === 'ios' ? (
        <SlackBottomSheet
          allowsDragToDismiss={false}
          allowsTapToDismiss={false}
          backgroundOpacity={0}
          blocksBackgroundTouches={false}
          cornerRadius={30}
          initialAnimation={false}
          interactsWithOuterScrollView
          isHapticFeedbackEnabled={false}
          presentGlobally={false}
          ref={ref}
          scrollsToTopOnTapStatusBar={isFocused}
          showDragIndicator={false}
          topOffset={insets.top}
          unmountAnimation={false}
        >
          <DiscoverSheetContent />
        </SlackBottomSheet>
      ) : (
        <BottomSheet
          borderRadius={20}
          overdragResistanceFactor={0}
          renderContent={DiscoverSheetContent}
          snapPoints={[300, 744]}
          springConfig={discoverSheetSpring}
        />
      )}
    </DiscoverSheetContext.Provider>
  );
}
