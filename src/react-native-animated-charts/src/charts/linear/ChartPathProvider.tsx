import React, { useMemo, useState } from 'react';
import { useAnimatedStyle } from 'react-native-reanimated';

import ChartContext, { useGenerateValues } from '../../helpers/ChartContext';

export default function ChartPathProvider({
  data: providedData,
  children,
}: any) {
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ChartContext.Provider value={contextValue}>
      {children}
    </ChartContext.Provider>
  );
}
