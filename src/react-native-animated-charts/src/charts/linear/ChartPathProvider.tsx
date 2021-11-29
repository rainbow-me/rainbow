import React, { useMemo, useState } from 'react';
import { useSharedValue } from 'react-native-reanimated';

import { ChartContext, DataType } from '../../helpers/ChartContext';

interface ChartPathProviderProps {
  data: DataType;
}

export const ChartPathProvider: React.FC<ChartPathProviderProps> = ({
  children,
  data,
}) => {
  const progress = useSharedValue(1);
  const dotScale = useSharedValue(0);
  const isActive = useSharedValue(false);
  const originalX = useSharedValue('');
  const originalY = useSharedValue('');
  const pathOpacity = useSharedValue(1);
  const layoutSize = useSharedValue(0);
  const state = useSharedValue(0);
  const positionX = useSharedValue(0);
  const positionY = useSharedValue(0);

  const value = useMemo(
    () => ({
      progress,
      dotScale,
      originalX,
      originalY,
      pathOpacity,
      layoutSize,
      state,
      positionX,
      positionY,
      isActive,
      data,
    }),
    [data]
  );

  return (
    <ChartContext.Provider value={value}>{children}</ChartContext.Provider>
  );
};
