import React, { useCallback, useContext, useEffect, useImperativeHandle, useState, type RefObject } from 'react';
import { Platform, Animated as RNAnimated, type ScrollViewProps, type ViewStyle } from 'react-native';

import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { BottomSheetContext } from '@gorhom/bottom-sheet/src/contexts/external';
import { useSharedValue } from 'react-native-reanimated';
import { type ScrollViewDefaultProps } from 'recyclerlistview/dist/reactnative/core/scrollcomponent/BaseScrollView';
import type BaseScrollView from 'recyclerlistview/dist/reactnative/core/scrollcomponent/BaseScrollView';
import { useMemoOne } from 'use-memo-one';

import { useRecyclerAssetListPosition } from '@/components/asset-list/RecyclerAssetList2/core/Contexts';
import { StickyHeaderContext } from '@/components/asset-list/RecyclerAssetList2/core/StickyHeaders';
import ImagePreviewOverlay from '@/components/images/ImagePreviewOverlay';
import { ProfileSheetConfigContext } from '@/screens/ProfileSheet';

import ProfileSheetHeader from './profile/ProfileSheetHeader';

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

    const [scrollEnabled, setScrollEnabled] = useState(Platform.OS === 'ios');
    useEffect(() => {
      // For Android, delay scroll until sheet has been mounted (to avoid
      // ImagePreviewOverlay mounting issues).
      if (Platform.OS === 'android') {
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

    const scrollWorklet = useCallback(
      (event: { contentOffset: { y: number } }) => {
        'worklet';
        yPosition.value = event.contentOffset.y;
      },
      [yPosition]
    );

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
        <ImagePreviewOverlay enableZoom={Platform.OS === 'ios' && enableZoomableImages} yPosition={yPosition}>
          {type === 'ens-profile' && <ProfileSheetHeader />}
          {props.children}
        </ImagePreviewOverlay>
      </ScrollView>
    );
  });

const ExternalENSProfileScrollViewWithRef = ExternalENSProfileScrollViewWithRefFactory('ens-profile');
const ExternalSelectNFTScrollViewWithRef = ExternalENSProfileScrollViewWithRefFactory('select-nft');
export { ExternalSelectNFTScrollViewWithRef, ExternalENSProfileScrollViewWithRef };
