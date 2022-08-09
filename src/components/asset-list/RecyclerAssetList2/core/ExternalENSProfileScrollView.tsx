import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { BottomSheetContext } from '@gorhom/bottom-sheet/src/contexts/external';
import React, {
  RefObject,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import { ScrollViewProps, ViewStyle } from 'react-native';
import Animated, { runOnUI, useSharedValue } from 'react-native-reanimated';

import BaseScrollView, {
  ScrollViewDefaultProps,
} from 'recyclerlistview/dist/reactnative/core/scrollcomponent/BaseScrollView';
import { ProfileSheetConfigContext } from '../../../../screens/ProfileSheet';
import ProfileSheetHeader from '../../../ens-profile/ProfileSheetHeader';
import ImagePreviewOverlay from '../../../images/ImagePreviewOverlay';
import { StickyHeaderContext } from './StickyHeaders';
import { useAndroidScrollViewGestureHandler } from '@/hooks';

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
  const { enableZoomableImages } = useContext(ProfileSheetConfigContext);

  const { onScroll, ...rest } = props;
  const { scrollViewRef } = useContext(StickyHeaderContext)!;

  const [scrollEnabled, setScrollEnabled] = useState(ios);
  useEffect(() => {
    // For Android, delay scroll until sheet has been mounted (to avoid
    // ImagePreviewOverlay mounting issues).
    if (android) {
      setTimeout(() => setScrollEnabled(true), 500);
    }
  });

  const yPosition = useSharedValue(0);

  const scrollHandler = useCallback(
    y => {
      'worklet';
      yPosition.value = y;
    },
    [yPosition]
  );

  const { onScroll: onAndroidScroll } = useAndroidScrollViewGestureHandler();

  const handleScroll = useCallback(
    event => {
      onScroll(event);
      android && onAndroidScroll(event);
      runOnUI(scrollHandler)(event.nativeEvent.contentOffset.y);
    },
    [onAndroidScroll, onScroll, scrollHandler]
  );

  useImperativeHandle(ref, () => scrollViewRef.current!);

  const ScrollView = isInsideBottomSheet
    ? BottomSheetScrollView
    : Animated.ScrollView;

  return (
    <ScrollView
      {...(rest as ScrollViewProps)}
      bounces={false}
      contentContainerStyle={[extraPadding, rest.contentContainerStyle]}
      onScroll={handleScroll}
      ref={scrollViewRef as RefObject<any>}
      scrollEnabled={scrollEnabled}
    >
      <ImagePreviewOverlay
        enableZoom={ios && enableZoomableImages}
        yPosition={yPosition}
      >
        <ProfileSheetHeader />
        {props.children}
      </ImagePreviewOverlay>
    </ScrollView>
  );
});
export default ExternalENSProfileScrollViewWithRef;
