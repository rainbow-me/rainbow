import { useIsFocused } from '@react-navigation/native';
import React, { Fragment } from 'react';
import { Platform, View } from 'react-native';
import Animated, { Value } from 'react-native-reanimated';
import { useSafeArea } from 'react-native-safe-area-context';
// eslint-disable-next-line import/no-unresolved
import SlackBottomSheet from 'react-native-slack-bottom-sheet';

import BottomSheet from 'reanimated-bottom-sheet';
import styled from 'styled-components/primitives';
import { Centered, ColumnWithMargins } from '../layout';
import { SlackSheet } from '../sheet';
import { Text } from '../text';
import DiscoverSheetHeader from './DiscoverSheetHeader';
import TopMoversSection from './TopMoversSection';
import { colors, position } from '@rainbow-me/styles';

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

const HeaderTitle = styled(Text).attrs({
  align: 'center',
  color: colors.blueGreyDark,
  letterSpacing: 'roundedMedium',
  lineHeight: 'loose',
  opacity: 0.8,
  size: 'large',
  weight: 'bold',
})``;

function Lorem() {
  return (
    <View>
      <Text>12312</Text>
      <Text>12312</Text>
      <Text>12312</Text>
      <Text>12312</Text>
      <Text>12312</Text>
      <Text>12312</Text>
      <Text>12312</Text>
      <Text>12312</Text>
      <Text>12312</Text>
      <Text>12312</Text>
      <Text>12312</Text>
      <Text>12312</Text>
      <Text>12312</Text>
      <Text>12312</Text>
      <Text>12312</Text>
      <Text>12312</Text>
      <Text>12312</Text>
      <Text>12312</Text>
      <Text>12312</Text>
      <Text>12312</Text>
      <Text>12312</Text>
      <Text>12312</Text>
      <Text>12312</Text>
      <Text>12312</Text>
      <Text>12312</Text>
      <Text>12312</Text>
      <Text>12312</Text>
      <Text>12312</Text>
      <Text>12312</Text>
      <Text>12312</Text>
      <Text>12312</Text>
      <Text>12312</Text>
      <Text>12312</Text>
      <Text>12312</Text>
      <Text>12312</Text>
      <Text>12312</Text>
    </View>
  );
}

const renderHeader = yPosition => <DiscoverSheetHeader yPosition={yPosition} />;

function DiscoverSheetContent() {
  return (
    <SlackSheet contentOffset={position.current} renderHeader={renderHeader}>
      <HeaderTitle>Discover</HeaderTitle>
      <ColumnWithMargins flex={1} margin={42}>
        <TopMoversSection />
        <Lorem />
      </ColumnWithMargins>
    </SlackSheet>
  );
}

export default function DiscoverSheet() {
  const insets = useSafeArea();
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
      presentGlobally={false}
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
  );
}
