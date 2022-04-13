import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { BottomSheetContext } from '@gorhom/bottom-sheet/src/contexts/external';
import React, { RefObject, useContext, useImperativeHandle } from 'react';
import { ScrollViewProps, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';

import BaseScrollView, {
  ScrollViewDefaultProps,
} from 'recyclerlistview/dist/reactnative/core/scrollcomponent/BaseScrollView';
import ProfileSheetHeader from '../../../ens-profile/ProfileSheetHeader';
import ImagePreviewOverlay from '../../../images/ImagePreviewOverlay';
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

  const { ...rest } = props;
  const { scrollViewRef } = useContext(StickyHeaderContext)!;

  const yPosition = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler(event => {
    yPosition.value = event.contentOffset.y;
  });

  useImperativeHandle(ref, () => scrollViewRef.current!);

  const ScrollView = isInsideBottomSheet
    ? BottomSheetScrollView
    : Animated.ScrollView;

  return (
    // @ts-ignore
    <ScrollView
      {...(rest as ScrollViewProps)}
      contentContainerStyle={[extraPadding, rest.contentContainerStyle]}
      ref={scrollViewRef as RefObject<any>}
      {...(isInsideBottomSheet
        ? {
            onScrollWorklet: scrollHandler,
          }
        : {
            onScroll: scrollHandler,
          })}
    >
      <ImagePreviewOverlay yPosition={yPosition}>
        <ProfileSheetHeader />
        {props.children}
      </ImagePreviewOverlay>
    </ScrollView>
  );
});
export default ExternalENSProfileScrollViewWithRef;
