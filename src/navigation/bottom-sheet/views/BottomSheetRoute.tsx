import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import { CONTAINER_HEIGHT } from '../constants';
// eslint-disable-next-line import/no-unresolved
import type { BottomSheetDescriptor } from '../types';

interface Props {
  routeKey: string;
  descriptor: BottomSheetDescriptor;
  removing?: boolean;
  onDismiss: (key: string, removed: boolean) => void;
}

const BottomSheetRoute = ({
  routeKey,
  descriptor: { options, render },
  onDismiss,
  removing = false,
}: Props) => {
  //#region refs
  const ref = useRef<BottomSheet>(null);
  const removingRef = useRef(false);
  removingRef.current = removing;
  //#endregion

  const {
    index = 1,
    snapPoints = ['100%'],
    backdropColor = 'black',
    backdropOpacity = 0.5,
    height = '100%',
  } = options || {};

  const screenContainerStyle = useMemo(() => ({ height }), [height]);
  const backdropStyle = useMemo(
    () => ({
      backgroundColor: backdropColor,
    }),
    [backdropColor]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const enhancedSpanPoints = useMemo(() => [0, ...snapPoints], [...snapPoints]);

  //#region callbacks
  const handleOnChange = useCallback((index: number) => {
    if (index === 0) {
      onDismiss(routeKey, removingRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  //#endregion

  //#region effects
  useEffect(() => {
    if (removing === true && ref.current) {
      ref.current.close();
    }
  }, [removing]);
  //#endregion

  //#region renders
  const renderBackdropComponent = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        appearsOnIndex={1}
        disappearsOnIndex={0}
        opacity={backdropOpacity}
        style={backdropStyle}
        {...props}
      />
    ),
    [backdropOpacity, backdropStyle]
  );

  return (
    <BottomSheet
      animateOnMount
      animationDuration={500}
      backdropComponent={renderBackdropComponent}
      backgroundComponent={null}
      containerHeight={CONTAINER_HEIGHT}
      handleComponent={null}
      index={index}
      onChange={handleOnChange}
      ref={ref}
      snapPoints={enhancedSpanPoints}
    >
      <View style={screenContainerStyle}>{render()}</View>
    </BottomSheet>
  );
};

export default BottomSheetRoute;
