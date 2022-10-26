import { BottomSheetHandleProps } from '@gorhom/bottom-sheet';
import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { SheetHandleFixedToTop } from '../../sheet';

interface HandleProps extends BottomSheetHandleProps {
  style?: StyleProp<ViewStyle>;
}

const Handle: React.FC<HandleProps> = () => {
  return <SheetHandleFixedToTop showBlur />;
};

export default Handle;
