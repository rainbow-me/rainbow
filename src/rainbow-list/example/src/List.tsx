import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  StyleSheet,
  Text,
  View,
  ViewProps,
  ViewStyle,
  Platform,
} from 'react-native';
import {
  CellStorage,
  RecyclerListView,
  RecyclerRow as RawRecyclerRow,
  RecyclerRowWrapper as RawRecyclerRowWrapper,
  UltraFastTextWrapper,
} from './ultimate';
import Animated, {
  runOnJS,
  useSharedValue,
  useDerivedValue,
  runOnUI,
} from 'react-native-reanimated';
// import {  } from './useImmediateDerivedValue';
import { useAnimatedRecycleHandler } from './useAnimatedRecycleEvent';
// @ts-ignore TODO osdnk
import { useImmediateEffect } from './useImmediateEffect';
import { getDiffArray } from './diffArray';

type SharedValue<T> = { value: T };
const DataContext = createContext<{
  lastEdited: SharedValue<number>;
  id: number;
} | null>(null);
const RawDataContext = createContext<any[] | null>(null);
const PositionContext = createContext<Animated.SharedValue<number> | null>(
  null
);
const InitialPositionContext = createContext<number>(-1);

const AnimatedRecyclableRow = Animated.createAnimatedComponent(RawRecyclerRow);

export function usePosition() {
  return useContext(PositionContext);
}

function useInitialPosition() {
  return useContext(InitialPositionContext);
}

function useData() {
  return useContext(DataContext);
}

function useRawData() {
  return useContext(RawDataContext);
}

export function useSharedDataAtIndex() {
  const { id, lastEdited } = useData()!;
  const position = usePosition();
  return useDerivedValue(() => {
    lastEdited.value;
    // @ts-ignore
    return global[`__ultimateList${id}`][position!.value];
  }, []);
}

export function useReactiveDataAtIndex() {
  const initialPosition = useInitialPosition();
  const [currentPosition, setPosition] = useState<number>(initialPosition);
  const sharedPosition = usePosition();

  useDerivedValue(() => {
    sharedPosition?.value !== -1 && runOnJS(setPosition)(sharedPosition!.value);
  });
  const rawDara = useRawData();
  return rawDara![currentPosition];
}

function RecyclerRowWrapper(
  props: ViewProps & { initialPosition: number; children: any }
) {
  const position = useSharedValue<number>(-1);
  return (
    <PositionContext.Provider value={position}>
      <RawRecyclerRowWrapper {...props} />
    </PositionContext.Provider>
  );
}

export function RecyclerRow(props: ViewProps & { children: any }) {
  const [isBackupNeeded, setIsBackupNeeded] = useState<boolean>(true);
  const position = useContext(PositionContext);
  const initialPosition = useContext(InitialPositionContext);
  //useState(() => (position.value = props.initialPosition))
  const onRecycleHandler = useAnimatedRecycleHandler(
    {
      onRecycle: ({ position: newPosition }) => {
        'worklet';
        if (isBackupNeeded) {
          runOnJS(setIsBackupNeeded)(false);
        }
        position!.value = newPosition;
      },
    },
    [isBackupNeeded]
  );

  const onRecycleHandlerBackup = useCallback(
    ({ nativeEvent: { position: newPosition } }) => {
      position!.value = newPosition;
    },
    [position]
  );

  // TODO osdnk sometimes broken

  return (
    <AnimatedRecyclableRow
      {...props}
      // @ts-ignore
      onRecycle={onRecycleHandler}
      onRecycleBackup={isBackupNeeded ? onRecycleHandlerBackup : null}
      initialPosition={initialPosition}
    />
  );
}

const namingHandler = {
  get(
    { binding }: { binding: string },
    property: string
  ): { binding: string } | string {
    if (property === '___binding') {
      return binding;
    }
    return new Proxy(
      { binding: binding === '' ? property : `${binding}.${property}` },
      namingHandler
    );
  },
};

export function useUltraFastData<TCellData extends object>() {
  return new Proxy({ binding: '' }, namingHandler) as any as TCellData;
}

export function UltraFastText({ binding }: { binding: string }) {
  return (
    // @ts-ignore
    <UltraFastTextWrapper binding={binding.___binding}>
      <Text style={{ width: 130 }} />
    </UltraFastTextWrapper>
  );
}

const AnimatedCellStorage = Animated.createAnimatedComponent(CellStorage);

const PRERENDERED_CELLS = 2; // todo osdnk

type WrappedView = { view: JSX.Element; maxRendered?: number };

type Descriptor = WrappedView | JSX.Element;

function RecyclableViews({
  viewTypes,
}: {
  viewTypes: { [_: string]: Descriptor };
}) {
  return (
    <>
      {Object.entries(viewTypes).map(([type, child]) => (
        <RecyclableViewsByType
          key={`rlvv-${type}`}
          type={type}
          maxRendered={(child as WrappedView).maxRendered}
        >
          {child.hasOwnProperty('view')
            ? (child as WrappedView).view
            : (child as JSX.Element)}
        </RecyclableViewsByType>
      ))}
    </>
  );
}

function RecyclableViewsByType({
  children,
  type,
  maxRendered = Infinity,
}: {
  children: React.ReactChild;
  type: string;
  maxRendered: number | undefined;
}) {
  const [isBackupNeeded, setIsBackupNeeded] = useState<boolean>(true);
  const [cells, setCells] = useState<number>(2);
  const onMoreRowsNeededHandler = useAnimatedRecycleHandler(
    {
      onMoreRowsNeeded: (e) => {
        'worklet';
        runOnJS(setCells)(e.cells);
        runOnJS(setIsBackupNeeded)(false);
      },
    },
    [setCells]
  );

  const onMoreRowsNeededHandlerBackup = useCallback(
    (e: { nativeEvent: { cells: number } }) => {
      if (e.nativeEvent.cells > cells) {
        setCells(e.nativeEvent.cells);
      }
    },
    [cells]
  );

  return (
    <AnimatedCellStorage
      // @ts-ignore
      style={{ opacity: 0.1 }}
      type={type}
      typeable={type}
      onMoreRowsNeeded={onMoreRowsNeededHandler}
      onMoreRowsNeededBackup={
        isBackupNeeded ? onMoreRowsNeededHandlerBackup : undefined
      }
    >
      {[
        ...Array(Math.min(maxRendered, Math.max(PRERENDERED_CELLS, cells))),
      ].map((_, index) => (
        <RecyclerRowWrapper
          removeClippedSubviews={false}
          initialPosition={index}
          key={`rl-${index}`}
        >
          <InitialPositionContext.Provider value={index}>
            {children}
          </InitialPositionContext.Provider>
        </RecyclerRowWrapper>
      ))}
    </AnimatedCellStorage>
  );
}

let id = 0;

type TraversedData<T> = {
  data: T;
  type: string;
  sticky: boolean;
  hash: string;
};

export function useRowTypesLayout(
  descriptors: () => { [key: string]: Descriptor },
  deps: any[] = []
) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(descriptors, [deps]);
}

export function RecyclerView<TData>({
  style,
  data,
  layoutProvider,
  getViewType = () => 'type',
  getIsSticky = () => false,
  getHash,
  isRefreshing = false,
  onRefresh,
}: {
  style: ViewStyle;
  data: TData[];
  layoutProvider: { [_: string]: Descriptor };
  getViewType: (data: TData, i: number) => string;
  getIsSticky: (data: TData, type: string, i: number) => boolean;
  getHash: (data: TData, i: number) => string;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}) {
  // @ts-ignore
  //global.setData(data)

  const [currId] = useState<number>(() => id++);
  const traversedData: TraversedData<TData>[] = useMemo(
    () =>
      data.map((row, index) => {
        const type = getViewType(row, index);
        const sticky = getIsSticky(row, type, index);
        const hash = getHash(row, index);
        return {
          data: row,
          type,
          sticky,
          hash,
        };
      }),
    [data, getViewType, getIsSticky, getHash]
  );
  const prevData = useRef<TraversedData<TData>[]>();

  const datas = useSharedValue<number>(0);
  useImmediateEffect(() => {
    // @ts-ignore
    global[`__ultimateList${currId}`] = data;
    datas.value = Date.now();
    runOnUI(() => {
      'worklet';
      // @ts-ignore
      global[`__ultimateList${currId}`] = data;
      datas.value = Date.now();
    })();
    // @ts-ignore
    global._list___setData(
      traversedData,
      currId,
      prevData.current
        ? getDiffArray(prevData.current, traversedData)
        : undefined
    );
  }, [traversedData]);

  useEffect(() => {
    // for ReText
    setTimeout(
      runOnUI(() => {
        'worklet';
        datas.value = Date.now() + 1050;
      }),
      500
    );
  }, [datas]);

  // @ts-ignore
  useEffect(() => () => global._list___removeData(currId), [currId]);

  prevData.current = traversedData;

  const [isJustCalledRefresh, setIsJustCalledRefresh] = useState(false);
  useEffect(() => {
    if (isJustCalledRefresh && !isRefreshing) {
      setIsJustCalledRefresh(false);
      // @ts-ignore
      ref.current.setNativeProps({ isRefreshing: false });
    }
  }, [isJustCalledRefresh, isRefreshing]);

  const onRefreshWrapper = useCallback(() => {
    onRefresh?.();
    Platform.OS === 'android' && setIsJustCalledRefresh(true);
  }, [onRefresh]);
  const ref = useRef<any>(null);

  return (
    <RawDataContext.Provider value={data}>
      <DataContext.Provider value={{ id: currId, lastEdited: datas }}>
        <View style={style} removeClippedSubviews={false}>
          <RecyclableViews viewTypes={layoutProvider} />
          <RecyclerListView
            ref={ref}
            onRefresh={onRefresh ? onRefreshWrapper : undefined}
            isRefreshing={isRefreshing}
            id={currId}
            identifier={currId}
            count={data.length}
            style={[StyleSheet.absoluteFill, { backgroundColor: 'red' }]}
          />
        </View>
      </DataContext.Provider>
    </RawDataContext.Provider>
  );
}
