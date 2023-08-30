import React, { useState } from 'react';
import { BottomSheet } from './BottomSheet';
import {
  BottomSheetView,
  useBottomSheetDynamicSnapPoints,
} from '@gorhom/bottom-sheet';
import {
  StyleProp,
  ViewStyle,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';

type Props = {
  snapPoints?: Array<string | number>;
  style?: StyleProp<ViewStyle>;
  fullWindowOverlay?: boolean;
};

export function AdaptiveBottomSheet({
  children,
  style,
  snapPoints = ['CONTENT_HEIGHT'],
  fullWindowOverlay,
}: React.PropsWithChildren<Props>) {
  const window = useWindowDimensions();
  const [height, setHeight] = useState(0);
  const isFullscreen = snapPoints.includes('100%') || height > window.height;
  const {
    animatedHandleHeight,
    animatedSnapPoints,
    animatedContentHeight,
    handleContentLayout,
  } = useBottomSheetDynamicSnapPoints(snapPoints);

  return (
    <BottomSheet
      snapPoints={animatedSnapPoints}
      handleHeight={animatedHandleHeight}
      contentHeight={animatedContentHeight}
      enableOverDrag={!isFullscreen}
      fullWindowOverlay={fullWindowOverlay}
    >
      {({ containerStyle }) => (
        <BottomSheetView
          style={StyleSheet.flatten([containerStyle, style])}
          onLayout={event => {
            setHeight(event.nativeEvent.layout.height);
            handleContentLayout(event);
          }}
        >
          {children}
        </BottomSheetView>
      )}
    </BottomSheet>
  );
}
