import React, { PropsWithChildren } from 'react';
import { BottomSheet } from './BottomSheet';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { StyleProp, ViewStyle } from 'react-native';

type Props = {
  renderBlur?: (
    containerStyle: StyleProp<ViewStyle>
  ) => React.ReactElement | null;
};

export function FullscreenBlurSheet({
  children,
  renderBlur,
}: PropsWithChildren<Props>) {
  return (
    <BottomSheet
      snapPoints={['100%']}
      enableOverDrag={false}
      showHandle={false}
      topInset={0}
    >
      {({ containerStyle }) => (
        <>
          {renderBlur && renderBlur(containerStyle)}
          <BottomSheetScrollView style={[containerStyle, { paddingTop: 0 }]}>
            {children}
          </BottomSheetScrollView>
        </>
      )}
    </BottomSheet>
  );
}
