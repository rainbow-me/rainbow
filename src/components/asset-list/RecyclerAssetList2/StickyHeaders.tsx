/* eslint-disable react-hooks/rules-of-hooks */
import { sortBy } from 'lodash';
import { number } from 'prop-types';
import React, {
  LegacyRef,
  MutableRefObject,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Animated as RNAnimated, View } from 'react-native';

import Animated, {
  Extrapolate,
  interpolate,
  ScrollView,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useRecyclerAssetListPosition } from './RecyclerAssetList2';

const Context = React.createContext<
  | {
      scrollViewRef: MutableRefObject<ScrollView>;
      interpolationsRanges: Record<string, { range: number[]; last: boolean }>;
      setMeasures: (position: number, height: number, name: string) => void;
    }
  | undefined
>(undefined);

export { Context as StickyHeaderContext };

export function StickyHeader({
  name,
  children,
}: {
  name: string;
  children: React.ReactChildren;
}) {
  const context = useContext(Context);
  if (!context) {
    return children;
  }
  const { setMeasures, interpolationsRanges, scrollViewRef } = context;
  const { range, last } = interpolationsRanges[name] || {};

  const position = useRecyclerAssetListPosition();
  const oldAnimatedStyle = useMemo(
    () => ({
      transform: range
        ? [
            {
              translateY: position!.interpolate({
                extrapolateLeft: 'clamp',
                extrapolateRight: last ? 'extend' : 'clamp',
                inputRange: range,
                outputRange: range.map(r => r - range[0]),
              }),
            },
          ]
        : [],
      zIndex: 1000,
    }),
    [last, position, range]
  );
  const ref = useRef<Animated.View>() as MutableRefObject<Animated.View>;
  const onLayout = useCallback(() => {
    const nativeScrollRef = scrollViewRef?.current?.getNativeScrollRef();
    // @ts-ignore
    ref.current?.measureLayout?.(
      nativeScrollRef,
      (_left: number, top: number, _width: number, height: number) => {
        setMeasures(top, height, name);
      },
      () => {}
    );
  }, [name, scrollViewRef, setMeasures]);

  if (!position) {
    return children;
  }
  return (
    <RNAnimated.View onLayout={onLayout} ref={ref} style={oldAnimatedStyle}>
      {children}
    </RNAnimated.View>
  );
}

export function StickyHeaderManager({
  children,
}: {
  children: React.ReactChildren;
}) {
  const [positions, setPositions] = useState<
    Record<string, { height: number; position: number; name: string }>
  >({});
  const interpolationsRanges: Record<
    string,
    { range: number[]; last: boolean }
  > = useMemo(() => {
    const sorted = sortBy(Object.values(positions), 'position');
    const ranges: number[][] = [];
    const rangesKeyed: Record<string, { range: number[]; last: boolean }> = {};

    for (let i = 0; i < sorted.length; i++) {
      const header = sorted[i];
      const range = [header.position];
      const nextHeader = sorted[i + 1];
      if (nextHeader) {
        range.push(nextHeader.position - header.height);
      } else {
        range.push(header.position + 1000);
      }
      ranges.push(range);
      rangesKeyed[header.name] = {
        last: i === sorted.length - 1,
        range: ranges[i],
      };
    }

    return rangesKeyed;
  }, [positions]);
  const scrollViewRef = useRef();
  const value = useMemo(
    () => ({
      interpolationsRanges,
      scrollViewRef,
      setMeasures(position: number, height: number, name: string) {
        setPositions(prev => ({ ...prev, [name]: { height, name, position } }));
      },
    }),
    [interpolationsRanges]
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
