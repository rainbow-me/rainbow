import React, { useCallback, useLayoutEffect, useMemo } from 'react';
import { BottomSheetModal, BottomSheetScrollView, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { colors } from '@/styles';

import { Box, useBackgroundColor } from '@/design-system';
import { OpenProps, usePortalStore } from '@/state/portal/portalStore';
import { useDimensions } from '@/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type PortalSheetProps = {
  sheetHeight?: number;
  children: React.FC;
  Footer?: React.ReactNode;
};

/**
 * The core Portal sheet
 */
export function Portal() {
  const {
    ref,
    key,
    close,
    title: TitleComponent,
    body: BodyComponent,
    footer: FooterComponent,
    containerProps,
    scrollViewProps,
    onDismiss,
  } = usePortalStore();

  const surfacePrimaryElevated = useBackgroundColor('surfacePrimaryElevated');

  const { top } = useSafeAreaInsets();
  const { height } = useDimensions();

  useLayoutEffect(() => {
    console.log('key', key);
    if (key) {
      ref?.current?.present();
    } else if (!key) {
      ref?.current?.dismiss();
    }
  }, [ref, key]);

  const handleClose = useCallback(() => {
    close();
    onDismiss?.();
  }, [close, onDismiss]);

  return (
    <BottomSheetModal
      ref={ref}
      key={key}
      onDismiss={handleClose}
      backdropComponent={CustomBackdrop}
      backgroundStyle={{ backgroundColor: colors.alpha(colors.black, 0.9) }}
      {...containerProps}
    >
      <Box
        gap={12}
        borderRadius={30}
        overflow="hidden"
        paddingVertical="44px"
        paddingHorizontal="32px"
        height="full"
        background={surfacePrimaryElevated}
      >
        {TitleComponent && <TitleComponent />}
        <BottomSheetScrollView style={{ flex: 1, maxHeight: height - top }} {...scrollViewProps}>
          {BodyComponent && <BodyComponent />}
        </BottomSheetScrollView>
        {FooterComponent && <FooterComponent />}
      </Box>
    </BottomSheetModal>
  );
}

export function open(props: OpenProps) {
  usePortalStore.getState().open(props);
}

export function close() {
  usePortalStore.getState().close();
}

const CustomBackdrop = ({ animatedPosition, style }: BottomSheetBackdropProps) => {
  const { height } = useDimensions();

  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(animatedPosition.value, [0, height], [0.9, 0], Extrapolation.CLAMP),
    };
  });

  const containerStyle = useMemo(
    () => [
      style,
      {
        backgroundColor: colors.black,
      },
      containerAnimatedStyle,
    ],
    [style, containerAnimatedStyle]
  );

  return <Animated.View style={containerStyle} />;
};

export default CustomBackdrop;
