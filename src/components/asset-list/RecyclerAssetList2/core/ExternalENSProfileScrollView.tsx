import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { BottomSheetContext } from '@gorhom/bottom-sheet/src/contexts/external';
import React, { RefObject, useContext, useImperativeHandle } from 'react';
import {
  Animated as RNAnimated,
  ScrollViewProps,
  ViewStyle,
} from 'react-native';
import { runOnJS, useWorkletCallback } from 'react-native-reanimated';

import BaseScrollView, {
  ScrollViewDefaultProps,
} from 'recyclerlistview/dist/reactnative/core/scrollcomponent/BaseScrollView';
import ProfileSheetHeader from '../../../ens-profile/ProfileSheetHeader';
import { StickyHeaderContext } from './StickyHeaders';

const extraPadding = { paddingBottom: 144 };
const ExternalENSProfileScrollViewWithRef = React.forwardRef<
  BaseScrollView,
  ScrollViewDefaultProps & {
    children: React.ReactNode;
    contentContainerStyle: ViewStyle;
  }
>(function ExternalScrollView(
  props: ScrollViewDefaultProps & {
    children: React.ReactNode;
    contentContainerStyle: ViewStyle;
  },
  ref
) {
  const isInsideBottomSheet = !!useContext(BottomSheetContext);

  const { onScroll, ...rest } = props;
  const { scrollViewRef } = useContext(StickyHeaderContext)!;
  const onScrollWrapped = useWorkletCallback(args => {
    runOnJS(onScroll)(args);
  }, []);

  useImperativeHandle(ref, () => scrollViewRef.current!);

  const ScrollView = isInsideBottomSheet
    ? BottomSheetScrollView
    : RNAnimated.ScrollView;

  return (
    // @ts-ignore
    <ScrollView
      {...(rest as ScrollViewProps)}
      contentContainerStyle={[extraPadding, rest.contentContainerStyle]}
      onScroll={onScrollWrapped}
      ref={scrollViewRef as RefObject<any>}
    >
      <ProfileSheetHeader />
      {props.children}
    </ScrollView>
  );
});
export default ExternalENSProfileScrollViewWithRef;
