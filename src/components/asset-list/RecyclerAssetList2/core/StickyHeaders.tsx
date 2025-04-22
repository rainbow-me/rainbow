/* eslint-disable react-hooks/rules-of-hooks */
import { sortBy } from 'lodash';
import React, { MutableRefObject, ReactElement, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Animated as RNAnimated } from 'react-native';
import Animated from 'react-native-reanimated';
import { BaseScrollView } from 'recyclerlistview';
import { useRecyclerAssetListPosition } from './Contexts';
import { useTheme } from '@/theme';

const Context = React.createContext<
  | {
      scrollViewRef: MutableRefObject<BaseScrollView | undefined>;
      interpolationsRanges: Record<string, { range: number[]; last: boolean }>;
      setMeasures: (position: number | undefined, height: number | undefined, name: string) => void;
      yOffset: number;
    }
  | undefined
>(undefined);

export { Context as StickyHeaderContext };

function StickyHeaderInternal({
  name,
  children,
  visibleAtYPosition = 0,
}: {
  name: string;
  children: React.ReactNode;
  visibleAtYPosition?: number;
}) {
  const context = useContext(Context);
  if (!context) {
    return children;
  }
  const { setMeasures, interpolationsRanges, scrollViewRef } = context;
  const { range: range_, last } = interpolationsRanges[name] || {};
  const range = range_?.map(r => r - context.yOffset);
  const { colors } = useTheme();

  const position = useRecyclerAssetListPosition();
  const animatedStyle = useMemo(
    () => ({
      backgroundColor: colors.white,
      opacity: visibleAtYPosition
        ? position!.interpolate({
            inputRange: [0, visibleAtYPosition, visibleAtYPosition],
            outputRange: [0, 0, 1],
          })
        : 1,
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
    }),
    [last, visibleAtYPosition, position, range]
  );
  const ref = useRef<Animated.View>() as MutableRefObject<Animated.View>;
  const onLayout = useCallback(() => {
    // @ts-ignore
    const nativeScrollRef = scrollViewRef?.current?.getNativeScrollRef();
    if (!nativeScrollRef) {
      return;
    }
    // @ts-ignore
    ref.current?.measureLayout?.(
      nativeScrollRef,
      (_left: number, top: number, _width: number, height: number) => {
        setMeasures(top, height, name);
      },
      () => {}
    );
  }, [name, scrollViewRef, setMeasures]);

  useLayoutEffect(
    () => () => {
      setMeasures(undefined, undefined, name);
    },
    [setMeasures, name]
  );

  if (!position) {
    return children;
  }
  return (
    <RNAnimated.View onLayout={onLayout} ref={ref} style={animatedStyle}>
      {children}
    </RNAnimated.View>
  );
}

export function StickyHeaderManager({ children, yOffset = 0 }: { children: ReactElement; yOffset?: number }) {
  const [positions, setPositions] = useState<Record<string, { height: number; position: number; name: string }>>({});
  const interpolationsRanges: Record<string, { range: number[]; last: boolean }> = useMemo(() => {
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
  const scrollViewRef = useRef<BaseScrollView>();
  const setMeasures = useCallback((position: number | undefined, height: number | undefined, name: string) => {
    setPositions(prev => {
      if (position === undefined || height === undefined) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete prev[name];
        return { ...prev };
      }
      return { ...prev, [name]: { height, name, position } };
    });
  }, []);
  const value = useMemo(
    () => ({
      yOffset,
      interpolationsRanges,
      scrollViewRef,
      setMeasures,
    }),
    [yOffset, interpolationsRanges, setMeasures]
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

// @ts-ignore
export const StickyHeader = React.memo(StickyHeaderInternal);
