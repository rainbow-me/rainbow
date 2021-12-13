/* eslint-disable react-hooks/rules-of-hooks */
import { sortBy } from 'lodash';
import React, {
  MutableRefObject,
  ReactElement,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Animated as RNAnimated } from 'react-native';
import Animated from 'react-native-reanimated';
import { BaseScrollView } from 'recyclerlistview';
import { useRecyclerAssetListPosition } from './Contexts';

const Context = React.createContext<
  | {
      scrollViewRef: MutableRefObject<BaseScrollView | undefined>;
      interpolationsRanges: Record<string, { range: number[]; last: boolean }>;
      setMeasures: (position: number, height: number, name: string) => void;
    }
  | undefined
>(undefined);

export { Context as StickyHeaderContext };

function StickyHeaderInternal({
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
  const animatedStyle = useMemo(
    () => ({
      backgroundColor: 'white',
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
    [last, position, range]
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

  if (!position) {
    return children;
  }
  return (
    <RNAnimated.View onLayout={onLayout} ref={ref} style={animatedStyle}>
      {children}
    </RNAnimated.View>
  );
}

export function StickyHeaderManager({ children }: { children: ReactElement }) {
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
  const scrollViewRef = useRef<BaseScrollView>();
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

// @ts-ignore
export const StickyHeader = React.memo(StickyHeaderInternal);
