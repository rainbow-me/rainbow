import { useIsFocused } from '@react-navigation/native';
import React, { Fragment, useCallback, useRef, useState } from 'react';
import { Platform } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeArea } from 'react-native-safe-area-context';
// eslint-disable-next-line import/no-unresolved
import SlackBottomSheet from 'react-native-slack-bottom-sheet';

import BottomSheet from 'reanimated-bottom-sheet';
import { ColumnWithMargins } from '../layout';
import { SlackSheet } from '../sheet';
import DiscoverSheetHeader from './DiscoverSheetHeader';
import TopMoversSection from './TopMoversSection';

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

const DiscoverSheetContent = () => (
  <Fragment>
    <DiscoverSheetHeader />
    <ColumnWithMargins flex={1} margin={42}>
      <TopMoversSection />
    </ColumnWithMargins>
  </Fragment>
);

export default function DiscoverSheet() {
  const insets = useSafeArea();
  const [initialPosition, setInitialPosition] = useState('long');
  const position = useRef({ x: 0, y: 0 });
  const setPosition = useCallback(
    ({ nativeEvent: { contentOffset } }) => (position.current = contentOffset),
    []
  );
  const isFocused = useIsFocused();
  // noinspection JSConstructorReturnsPrimitive
  return Platform.OS === 'ios' ? (
    <SlackBottomSheet
      allowsDragToDismiss={false}
      allowsTapToDismiss={false}
      backgroundOpacity={0}
      blocksBackgroundTouches={false}
      cornerRadius={30}
      initialAnimation={false}
      interactsWithOuterScrollView
      isHapticFeedbackEnabled={false}
      onWillTransition={({ type }) => setInitialPosition(type)}
      presentGlobally={false}
      scrollsToTopOnTapStatusBar={isFocused}
      showDragIndicator={false}
      startFromShortForm={initialPosition === 'short'}
      topOffset={insets.top}
      unmountAnimation={false}
    >
      <SlackSheet
        contentOffset={position.current}
        onMomentumScrollEnd={setPosition}
        onScrollEndDrag={setPosition}
      >
        <DiscoverSheetContent />
      </SlackSheet>
    </SlackBottomSheet>
  ) : (
    <BottomSheet
      borderRadius={20}
      overdragResistanceFactor={0}
      renderContent={DiscoverSheetContent}
      snapPoints={[300, 744]}
      springConfig={discoverSheetSpring}
    />
  );
}
