import React from 'react';
import { ScrollView, View } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { Box } from '@/design-system';
import { IS_IOS } from '@/env';

export const SheetGestureBlocker = ({
  children,
  disabled,
  preventScrollViewDismissal = true,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  preventScrollViewDismissal?: boolean;
}) => {
  return IS_IOS ? (
    // @ts-expect-error Property 'children' does not exist on type
    <PanGestureHandler enabled={!disabled}>
      <View style={{ height: '100%', width: '100%' }}>
        <>
          {children}
          {preventScrollViewDismissal && (
            <Box height={{ custom: 0 }} pointerEvents="none" position="absolute" style={{ opacity: 0, zIndex: -100 }}>
              <ScrollView scrollEnabled={false} />
            </Box>
          )}
        </>
      </View>
    </PanGestureHandler>
  ) : (
    <>{children}</>
  );
};
