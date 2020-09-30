import React, { createContext, useContext, useMemo, useState } from 'react';
import { Dimensions } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { ChartPath, ChartPathProvider } from '@rainbow-me/animated-charts';

const Context = createContext({});

export const { width: WIDTH } = Dimensions.get('window');

const HEIGHT = 146.5;

export function ChartProvider(props) {
  const spinnerRotation = useSharedValue(0, 'spinnerRotation');
  const spinnerScale = useSharedValue(0, 'spinnerScale');
  const chartTimeSharedValue = useSharedValue('', 'chartTimeSharedValue');
  const [chartData, setChartData] = useState({});
  const { data, children, ...rest } = useMemo(
    () => ({
      __disableRendering: true,
      chartData,
      data: {},
      ...props,
      ...chartData,
      fill: 'none',
      hapticsEnabled: true,
      height: HEIGHT,
      hitSlop: 30,
      longPressGestureHandlerProps: {
        minDurationMs: 60,
      },
      selectedStrokeWidth: 3,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      strokeWidth: 3.5,
      values: {
        chartTimeSharedValue,
        spinnerRotation,
        spinnerScale,
      },
      width: WIDTH,
    }),
    [chartData, props, chartTimeSharedValue, spinnerRotation, spinnerScale]
  );
  const value = useMemo(() => ({ data, ...rest, setChartData }), [data, rest]);
  return (
    <Context.Provider value={value}>
      <ChartPathProvider data={data}>
        <ChartPath __disableRendering {...rest}>
          {children}
        </ChartPath>
      </ChartPathProvider>
    </Context.Provider>
  );
}

export function useSetChartData() {
  return useContext(Context).setChartData;
}

export function useLatestChartData() {
  return useContext(Context).chartData;
}

export function useChartContextData() {
  return useContext(Context).data;
}

export function useSharedValues() {
  return useContext(Context).values;
}
