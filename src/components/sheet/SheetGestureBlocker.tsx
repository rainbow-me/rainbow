import React from 'react';
import { Platform, ScrollView, View } from 'react-native';

import { PanGestureHandler } from 'react-native-gesture-handler';

import { Box } from '@/design-system';

export const SheetGestureBlocker = ({
  children,
  disabled,
  preventScrollViewDismissal = true,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  preventScrollViewDismissal?: boolean;
}) => {
  return Platform.OS === 'ios' ? (
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
