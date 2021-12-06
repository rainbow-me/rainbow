import { BottomSheetHandleProps } from '@gorhom/bottom-sheet';
import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { SheetHandleFixedToTop } from '../../sheet';

interface HandleProps extends BottomSheetHandleProps {
  style?: StyleProp<ViewStyle>;
}

const Handle: React.FC<HandleProps> = () => {
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  return <SheetHandleFixedToTop showBlur />;
};

export default Handle;
