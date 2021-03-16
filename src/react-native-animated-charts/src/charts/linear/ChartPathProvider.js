import React, { useMemo, useState } from 'react';
import { useAnimatedStyle } from 'react-native-reanimated';
import ChartContext, { useGenerateValues } from '../../helpers/ChartContext';

export default function ChartPathProvider({ data: providedData, children }) {
  const values = useGenerateValues();
  const dotStyle = useAnimatedStyle(
    () => ({
      opacity: values.dotScale.value,
      transform: [
        { translateX: values.positionX.value },
        { translateY: values.positionY.value + 10 }, // TODO temporary fix for clipped chart
        { scale: values.dotScale.value },
      ],
    }),
    []
  );
  const [contextReanimatedValue, setContextValue] = useState({});
  const contextValue = useMemo(
    () => ({
      dotStyle,
      ...values,
      ...contextReanimatedValue,
      providedData,
      setContextValue,
    }),
    [dotStyle, values, contextReanimatedValue, providedData]
  );

  return (
    <ChartContext.Provider value={contextValue}>
      {children}
    </ChartContext.Provider>
  );
}
