import React, { useMemo, useState } from 'react';
import ChartContext, { useGenerateValues } from '../../helpers/ChartContext';

export default function ChartPathProvider({ data: providedData, children }) {
  const values = useGenerateValues();
  const [contextReanimatedValue, setContextValue] = useState({});
  const contextValue = useMemo(
    () => ({
      ...values,
      ...contextReanimatedValue,
      providedData,
      setContextValue,
    }),
    [values, contextReanimatedValue, providedData]
  );

  return (
    <ChartContext.Provider value={contextValue}>
      {children}
    </ChartContext.Provider>
  );
}
