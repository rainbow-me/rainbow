import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { CONTAINER_HEIGHT } from '../constants';
// eslint-disable-next-line import/no-unresolved
import type { BottomSheetDescriptor } from '../types';

interface Props {
  routeKey: string;
  descriptor: BottomSheetDescriptor;
  removing?: boolean;
  onDismiss: (key: string) => void;
}

const BottomSheetRoute = ({
  routeKey,
  descriptor: { options, render },
  onDismiss,
  removing = false,
}: Props) => {
  //#region refs
  const ref = useRef<BottomSheet>(null);
  //#endregion

  const {
    index = 1,
    snapPoints = ['100%'],
    backdropColor = 'black',
    backdropOpacity = 0.5,
    // height = '100%',
  } = options || {};

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
      onDismiss(routeKey);
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
        closeOnPress
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
      children={render}
      containerHeight={CONTAINER_HEIGHT}
      handleComponent={null}
      index={index}
      onChange={handleOnChange}
      ref={ref}
      snapPoints={enhancedSpanPoints}
    />
  );
};

export default BottomSheetRoute;
