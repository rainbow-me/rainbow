import { useIsFocused } from '@react-navigation/native';
import React, { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeArea } from 'react-native-safe-area-context';
// eslint-disable-next-line import/no-unresolved
import SlackBottomSheet from 'react-native-slack-bottom-sheet';
import { ColumnWithMargins } from '../layout';
import { SlackSheet } from '../sheet';
import DiscoverSheetHeader from './DiscoverSheetHeader';
import TopMoversSection from './TopMoversSection';
import { position } from '@rainbow-me/styles';
import { deviceUtils } from '@rainbow-me/utils';
import {
  YABSForm,
  YABSScrollView,
} from 'react-native-yet-another-bottom-sheet';

const DiscoverSheetContent = () => (
  <Fragment>
    <DiscoverSheetHeader />
    <ColumnWithMargins flex={1} margin={42}>
      <TopMoversSection />
    </ColumnWithMargins>
  </Fragment>
);

function DiscoverSheetAndroid() {
  return (
    <YABSForm
      panGHProps={{
        simultaneousHandlers: 'AnimatedScrollViewPager',
      }}
      points={[0, 200, deviceUtils.dimensions.height - 200]}
      style={[
        StyleSheet.absoluteFillObject,
        {
          backgroundColor: 'white',
          bottom: 0,
          top: 100,
        },
      ]}
    >
      <View style={{ backgroundColor: 'yellow', height: 40, width: '100%' }} />
      <YABSScrollView>
        <DiscoverSheetContent />
      </YABSScrollView>
    </YABSForm>
  );
}

function DiscoverSheetIOS() {
  const insets = useSafeArea();
  const isFocused = useIsFocused();

  // noinspection JSConstructorReturnsPrimitive
  return (
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
      scrollsToTopOnTapStatusBar={isFocused}
      showDragIndicator={false}
      topOffset={insets.top}
      unmountAnimation={false}
    >
      <SlackSheet contentOffset={position.current}>
        <DiscoverSheetContent />
      </SlackSheet>
    </SlackBottomSheet>
  );
}

export default ios ? DiscoverSheetIOS : DiscoverSheetAndroid;
