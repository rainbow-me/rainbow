import React, { act, useEffect, type ReactElement } from 'react';
import {
  FlatList,
  ScrollView,
  View,
  type CellRendererProps,
  type FlatListProps,
  type LayoutChangeEvent,
  type NativeSyntheticEvent,
  type ScrollViewProps,
  type ViewabilityConfig,
  type ViewToken,
} from 'react-native';

import { noop } from 'lodash';
import { type ReactNativeType } from 'react-native/types_generated/Libraries/Renderer/shims/ReactNativeTypes.d';

import { useViewabilityTracker, type ViewabilitySelectors } from '@/framework/ui/hooks/useViewabilityTracker';

// ============ Constants ====================================================== //

const ROOT_TAG = 121;
const ROW_HEIGHT = 100;
const VIEWPORT_SIZE = { width: 100, height: ROW_HEIGHT };
const FOOTER_HEIGHT = VIEWPORT_SIZE.height;

const LIST_UPDATE_INTERVAL_MS = 50;
const MINIMUM_VIEW_TIME_MS = 1000;
const TRACKER_DEBOUNCE_MS = 250;
const SETTLE_TIME_MS = 2 * LIST_UPDATE_INTERVAL_MS + TRACKER_DEBOUNCE_MS;

const SELECTORS: ViewabilitySelectors<ViewToken<string>> = { getId: token => token.item };
const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 1 };
const DELAYED_VIEWABILITY_CONFIG = { ...VIEWABILITY_CONFIG, minimumViewTime: MINIMUM_VIEW_TIME_MS };

// ============ List Fixture =================================================== //

const renderer = jest.requireActual<ReactNativeType>('react-native/Libraries/Renderer/implementations/ReactNativeRenderer-dev');

const { register } = jest.requireActual<
  typeof import('react-native/types_generated/Libraries/Renderer/shims/ReactNativeViewConfigRegistry')
>('react-native/Libraries/Renderer/shims/ReactNativeViewConfigRegistry');

for (const name of ['View', 'RCTScrollView']) {
  register(name, () => ({ uiViewClassName: name, validAttributes: {} }));
}

const onReport = jest.fn<void, Parameters<NonNullable<FlatListProps<string>['onViewableItemsChanged']>>>();
const onChange = jest.fn<void, [readonly string[]]>();
const eventTarget = new View({});

let scrollProps: ScrollViewProps;
let contentHeight: number;

function Cell({ children, index, onLayout }: CellRendererProps<string>): ReactElement {
  useEffect(() => {
    onLayout?.(layoutEvent(index * ROW_HEIGHT));
  }, [index, onLayout]);

  return <View>{children}</View>;
}

function renderScrollComponent(props: ScrollViewProps): ReactElement<ScrollViewProps> {
  scrollProps = props;

  return React.createElement(ScrollView, props);
}

function List({ data, viewabilityConfig }: Pick<FlatListProps<string>, 'data' | 'viewabilityConfig'>): ReactElement {
  const { onViewableItemsChanged } = useViewabilityTracker(SELECTORS, onChange);

  return (
    <FlatList
      data={data}
      renderItem={() => <View style={{ height: ROW_HEIGHT }} />}
      keyExtractor={item => item}
      CellRendererComponent={Cell}
      ListFooterComponent={<View style={{ height: FOOTER_HEIGHT }} />}
      renderScrollComponent={renderScrollComponent}
      onViewableItemsChanged={info => {
        onReport(info);
        onViewableItemsChanged(info);
      }}
      viewabilityConfig={viewabilityConfig}
      updateCellsBatchingPeriod={LIST_UPDATE_INTERVAL_MS}
    />
  );
}

function renderList(data: readonly string[], viewabilityConfig: ViewabilityConfig = VIEWABILITY_CONFIG): void {
  act(() => renderer.render(<List data={data} viewabilityConfig={viewabilityConfig} />, ROOT_TAG, undefined, undefined));

  contentHeight = data.length * ROW_HEIGHT + FOOTER_HEIGHT;

  act(() => scrollProps.onContentSizeChange?.(VIEWPORT_SIZE.width, contentHeight));
}

function layout(): void {
  act(() => scrollProps.onLayout?.(layoutEvent()));
}

function scrollTo(offset: number): void {
  const event = createNativeEvent('scroll', {
    contentOffset: { x: 0, y: offset },
    contentSize: { width: VIEWPORT_SIZE.width, height: contentHeight },
    layoutMeasurement: VIEWPORT_SIZE,
    zoomScale: 1,
    contentInset: { top: 0, bottom: 0, left: 0, right: 0 },
  });

  act(() => scrollProps.onScroll?.(event));
}

function advanceTime(ms = SETTLE_TIME_MS): void {
  for (let remaining = ms; remaining > 0; remaining -= LIST_UPDATE_INTERVAL_MS) {
    act(() => jest.advanceTimersByTime(Math.min(remaining, LIST_UPDATE_INTERVAL_MS)));
  }
}

function layoutEvent(y = 0): LayoutChangeEvent {
  return createNativeEvent('layout', { layout: { x: 0, y, ...VIEWPORT_SIZE } });
}

function createNativeEvent<T>(type: string, nativeEvent: T): NativeSyntheticEvent<T> {
  return {
    nativeEvent,
    type,
    target: eventTarget,
    currentTarget: eventTarget,
    timeStamp: Date.now(),
    bubbles: false,
    cancelable: false,
    defaultPrevented: false,
    eventPhase: 0,
    isTrusted: false,
    isDefaultPrevented: () => false,
    isPropagationStopped: () => false,
    preventDefault: noop,
    stopPropagation: noop,
    persist: noop,
  };
}

function viewToken(item: string, index = 0, isViewable = true): ViewToken<string> {
  return { item, key: item, index, isViewable };
}

// ============ Tests ========================================================== //

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
});

afterEach(() => {
  act(() => renderer.unmountComponentAtNode(ROOT_TAG));
  jest.useRealTimers();
});

it('clears empty data and reports the same items when they return', () => {
  renderList(['a']);
  layout();
  scrollTo(0);
  advanceTime();
  expect(onChange).toHaveBeenLastCalledWith(['a']);

  renderList([]);
  advanceTime();
  expect(onReport).toHaveBeenLastCalledWith({
    viewableItems: [],
    changed: [viewToken('a', 0, false)],
    viewabilityConfig: VIEWABILITY_CONFIG,
  });
  expect(onChange).toHaveBeenLastCalledWith([]);

  renderList(['a']);
  advanceTime();
  expect(onReport).toHaveBeenLastCalledWith({
    viewableItems: [viewToken('a')],
    changed: [viewToken('a')],
    viewabilityConfig: VIEWABILITY_CONFIG,
  });
  expect(onReport).toHaveBeenCalledTimes(3);
  expect(onChange).toHaveBeenLastCalledWith(['a']);
});

it('clears a viewport even when the previously visible item remains elsewhere in the data', () => {
  renderList(['a', 'b']);
  layout();

  scrollTo(ROW_HEIGHT);
  advanceTime();
  expect(onChange).toHaveBeenLastCalledWith(['b']);

  renderList(['b']);
  advanceTime();
  expect(onReport).toHaveBeenLastCalledWith({
    viewableItems: [],
    changed: [viewToken('b', 1, false)],
    viewabilityConfig: VIEWABILITY_CONFIG,
  });
  expect(onChange).toHaveBeenLastCalledWith([]);

  scrollTo(0);
  advanceTime();
  expect(onChange).toHaveBeenLastCalledWith(['b']);
});

it.each([
  { change: 'replacement without empty data', emptyFor: null },
  { change: 'refill before the next list update', emptyFor: LIST_UPDATE_INTERVAL_MS - 1 },
  { change: 'refill after an empty list update', emptyFor: LIST_UPDATE_INTERVAL_MS + 1 },
])('does not report removed items after $change', ({ emptyFor }) => {
  renderList(['a'], DELAYED_VIEWABILITY_CONFIG);
  layout();
  scrollTo(0);
  advanceTime(MINIMUM_VIEW_TIME_MS / 2);

  if (emptyFor !== null) {
    renderList([], DELAYED_VIEWABILITY_CONFIG);
    advanceTime(emptyFor);
  }

  renderList(['b'], DELAYED_VIEWABILITY_CONFIG);
  advanceTime(MINIMUM_VIEW_TIME_MS / 2 - (emptyFor ?? 0));
  expect(onReport).not.toHaveBeenCalled();

  advanceTime(MINIMUM_VIEW_TIME_MS);
  expect(onReport).toHaveBeenCalledTimes(1);
  expect(onReport).toHaveBeenLastCalledWith({
    viewableItems: [viewToken('b')],
    changed: [viewToken('b')],
    viewabilityConfig: DELAYED_VIEWABILITY_CONFIG,
  });

  advanceTime(TRACKER_DEBOUNCE_MS);
  expect(onChange).toHaveBeenLastCalledWith(['b']);
});

it('keeps the pending report when scrolling leaves the visible rows unchanged', () => {
  renderList(['a'], DELAYED_VIEWABILITY_CONFIG);
  layout();

  scrollTo(0);
  advanceTime(MINIMUM_VIEW_TIME_MS / 2);
  scrollTo(ROW_HEIGHT / 2);
  advanceTime(MINIMUM_VIEW_TIME_MS / 2);

  expect(onReport).toHaveBeenCalledTimes(1);
  expect(onReport.mock.calls[0][0].viewableItems).toEqual([viewToken('a')]);
});

it('does not clear visible rows when an earlier empty report expires', () => {
  renderList(['a'], DELAYED_VIEWABILITY_CONFIG);
  layout();

  scrollTo(0);
  advanceTime(MINIMUM_VIEW_TIME_MS);
  expect(onReport.mock.calls[0][0].viewableItems).toEqual([viewToken('a')]);

  scrollTo(ROW_HEIGHT);
  advanceTime(LIST_UPDATE_INTERVAL_MS);
  scrollTo(0);
  advanceTime(MINIMUM_VIEW_TIME_MS);
  expect(onReport).toHaveBeenCalledTimes(1);
  expect(onChange).toHaveBeenLastCalledWith(['a']);
});
