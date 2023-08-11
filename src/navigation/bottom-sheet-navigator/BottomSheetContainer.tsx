import React from 'react';
import {
  StackDescriptorMap,
  StackNavigationConfig,
  StackNavigationHelpers,
  StackNavigationProp,
} from '@react-navigation/stack/lib/typescript/src/types';
import {
  Descriptor,
  ParamListBase,
  Route,
  RouteProp,
  StackActions,
  StackNavigationState,
} from '@react-navigation/core';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetView,
  useBottomSheetDynamicSnapPoints,
} from '@gorhom/bottom-sheet';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNavigationOptions } from './createBottomSheetNavigator';

const DEFAULT_BACKDROP_COLOR = 'black';
const DEFAULT_BACKDROP_OPACITY = 0.5;

export type BottomSheetDescriptor = Descriptor<
  BottomNavigationOptions,
  StackNavigationProp<ParamListBase>,
  RouteProp<ParamListBase>
>;

type Props = StackNavigationConfig & {
  state: StackNavigationState<ParamListBase>;
  navigation: StackNavigationHelpers;
  descriptors: Record<string, BottomSheetDescriptor>;
  route: Route<string>;
};

export function BottomSheetContainer({
  navigation,
  descriptors,
  route,
  state,
}: Props) {
  const options = descriptors[route.key].options;
  const safeAreaInsets = useSafeAreaInsets();

  const handleOnClose = () => {
    console.log('CLOSING XD');
    navigation?.dispatch?.({
      ...StackActions.pop(),
      source: route.key,
      // target: state.key,
    });
  };

  const renderBackdropComponent = (props: BottomSheetBackdropProps) => (
    <BottomSheetBackdrop
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      opacity={DEFAULT_BACKDROP_OPACITY}
      // style={{ backgroundColor: DEFAULT_BACKDROP_COLOR }}
      {...props}
    />
  );

  const {
    animatedHandleHeight,
    animatedSnapPoints,
    animatedContentHeight,
    handleContentLayout,
  } = useBottomSheetDynamicSnapPoints(options.snapPoints || ['100%']);

  return (
    <BottomSheet
      // activeOffsetY={[-3, 3]}
      animateOnMount
      backdropComponent={renderBackdropComponent}
      // containerHeight={800}
      // enableContentPanningGesture={enableContentPanningGesture}
      // enableHandlePanningGesture={enableHandlePanningGesture}
      enableContentPanningGesture={true}
      enableHandlePanningGesture={true}
      enablePanDownToClose
      enableOverDrag
      // handleComponent={null}
      backgroundStyle={{
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
      }}
      // index={index}
      onClose={handleOnClose}
      // ref={ref}
      simultaneousHandlers={[]}
      // snapPoints={options.snapPoints}
      topInset={safeAreaInsets.top}
      snapPoints={animatedSnapPoints}
      handleHeight={animatedHandleHeight}
      contentHeight={animatedContentHeight}
      waitFor={[]}
    >
      <BottomSheetView
        onLayout={handleContentLayout}
        style={{
          flex: 1,
        }}
      >
        {descriptors[route.key].render()}
      </BottomSheetView>
    </BottomSheet>
  );
}
