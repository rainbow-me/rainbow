import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { BottomSheetContext } from '@gorhom/bottom-sheet/src/contexts/external';
import React, { RefObject, useContext, useEffect, useImperativeHandle, useState } from 'react';
import { ScrollViewProps, ViewStyle, Animated as RNAnimated } from 'react-native';
import { useSharedValue, useWorkletCallback } from 'react-native-reanimated';

import BaseScrollView, { ScrollViewDefaultProps } from 'recyclerlistview/dist/reactnative/core/scrollcomponent/BaseScrollView';
import { ProfileSheetConfigContext } from '../../../../screens/ProfileSheet';
import ProfileSheetHeader from '../../../ens-profile/ProfileSheetHeader';
import ImagePreviewOverlay from '../../../images/ImagePreviewOverlay';
import { StickyHeaderContext } from './StickyHeaders';
import { useMemoOne } from 'use-memo-one';
import { useRecyclerAssetListPosition } from './Contexts';

const extraPadding = { paddingBottom: 144 };
const ExternalENSProfileScrollViewWithRefFactory = (type: string) =>
  React.forwardRef<
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
    const y = useRecyclerAssetListPosition()!;

    const event = useMemoOne(
      () =>
        RNAnimated.event(
          [
            {
              nativeEvent: {
                contentOffset: {
                  y,
                },
              },
            },
          ],
          { listener: props.onScroll, useNativeDriver: true }
        ),
      [props.onScroll, y]
    );

    const scrollWorklet = useWorkletCallback((event: { contentOffset: { y: number } }) => {
      yPosition.value = event.contentOffset.y;
    });

    useImperativeHandle(ref, () => scrollViewRef.current!);

    const ScrollView = isInsideBottomSheet ? BottomSheetScrollView : RNAnimated.ScrollView;

    return (
      <ScrollView
        {...(props as ScrollViewProps)}
        bounces={false}
        contentContainerStyle={[extraPadding, props.contentContainerStyle]}
        ref={scrollViewRef as RefObject<any>}
        scrollEnabled={scrollEnabled}
        {...(isInsideBottomSheet
          ? {
              onScrollWorklet: scrollWorklet,
            }
          : {
              onScroll: event,
            })}
      >
        <ImagePreviewOverlay enableZoom={ios && enableZoomableImages} yPosition={yPosition}>
          {type === 'ens-profile' && <ProfileSheetHeader />}
          {props.children}
        </ImagePreviewOverlay>
      </ScrollView>
    );
  });

const ExternalENSProfileScrollViewWithRef = ExternalENSProfileScrollViewWithRefFactory('ens-profile');
const ExternalSelectNFTScrollViewWithRef = ExternalENSProfileScrollViewWithRefFactory('select-nft');
export { ExternalSelectNFTScrollViewWithRef, ExternalENSProfileScrollViewWithRef };
