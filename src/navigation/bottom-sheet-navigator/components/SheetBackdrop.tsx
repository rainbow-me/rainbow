import React from 'react';
import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';

const DEFAULT_BACKDROP_OPACITY = 0.5;

export function SheetBackdrop(props: BottomSheetBackdropProps) {
  return (
    <BottomSheetBackdrop
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      opacity={DEFAULT_BACKDROP_OPACITY}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    />
  );
}
