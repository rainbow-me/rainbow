import React, { act, type ReactElement } from 'react';
import {
  FlatList,
  ScrollView,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewProps,
  type ViewProps,
  type ViewToken,
} from 'react-native';

import { type ReactNativeType } from 'react-native/types_generated/Libraries/Renderer/shims/ReactNativeTypes.d';

import { useViewabilityTracker, type ViewabilitySelectors } from '@/framework/ui/hooks/useViewabilityTracker';

const renderer = jest.requireActual<ReactNativeType>('react-native/Libraries/Renderer/implementations/ReactNativeRenderer-dev');
// Register the preset's host stubs; FlatList and its viewability helper remain real.
const { register } = jest.requireActual<
  typeof import('react-native/types_generated/Libraries/Renderer/shims/ReactNativeViewConfigRegistry')
>('react-native/Libraries/Renderer/shims/ReactNativeViewConfigRegistry');
for (const name of ['View', 'RCTScrollView']) {
  register(name, () => ({ uiViewClassName: name, validAttributes: {} }));
}

const selectors: ViewabilitySelectors<ViewToken<string>> = { getId: token => token.item };
const config = { itemVisiblePercentThreshold: 1 };
const delayedConfig = { ...config, minimumViewTime: 1000 };
const onReport = jest.fn();
const onChange = jest.fn();
const cellLayouts = new Map<string, ViewProps['onLayout']>();
let scrollProps: ScrollViewProps;
let contentHeight: number;

function Cell({ item, children, onLayout }: Pick<ViewProps, 'children' | 'onLayout'> & { item: string }): ReactElement {
  cellLayouts.set(item, onLayout);
  return <View onLayout={onLayout}>{children}</View>;
}

function renderScrollComponent(props: ScrollViewProps): ReactElement<ScrollViewProps> {
  scrollProps = props;
  return React.createElement(ScrollView, props);
}

function List({ data, delayed = false }: { data: readonly string[]; delayed?: boolean }): ReactElement {
  const { onViewableItemsChanged } = useViewabilityTracker(selectors, onChange);
  return (
    <FlatList
      data={data}
      renderItem={() => <View style={{ height: 100 }} />}
      keyExtractor={item => item}
      CellRendererComponent={Cell}
      ListFooterComponent={<View style={{ height: 100 }} />}
      renderScrollComponent={renderScrollComponent}
      onViewableItemsChanged={info => {
        onReport(info);
        onViewableItemsChanged(info);
      }}
      viewabilityConfig={delayed ? delayedConfig : config}
    />
  );
}

function render(data: readonly string[], delayed = false): void {
  act(() => renderer.render(<List data={data} delayed={delayed} />, 121, undefined, undefined));
  // The footer keeps offset 100 valid when only one row remains.
  contentHeight = (data.length + 1) * 100;
  act(() => {
    data.forEach((item, index) => cellLayouts.get(item)?.(layoutEvent(index * 100)));
    scrollProps.onContentSizeChange?.(100, contentHeight);
  });
}

function scroll(offset: number): void {
  act(() =>
    scrollProps.onScroll?.({
      timeStamp: Date.now(),
      nativeEvent: {
        contentOffset: { x: 0, y: offset },
        contentSize: { width: 100, height: contentHeight },
        layoutMeasurement: { width: 100, height: 100 },
        zoomScale: 1,
        contentInset: { top: 0, bottom: 0, left: 0, right: 0 },
      },
    } as NativeSyntheticEvent<NativeScrollEvent>)
  );
}

function layoutEvent(y = 0): LayoutChangeEvent {
  return { nativeEvent: { layout: { x: 0, y, width: 100, height: 100 } } } as LayoutChangeEvent;
}

function layout(): void {
  act(() => scrollProps.onLayout?.(layoutEvent()));
}

function viewToken(item: string, index = 0, isViewable = true): ViewToken<string> {
  return { item, key: item, index, isViewable };
}

function advance(ms = 250): void {
  // Let React commit each list render batch before the next timer runs.
  for (let remaining = ms; remaining > 0; remaining -= 50) {
    act(() => jest.advanceTimersByTime(Math.min(remaining, 50)));
  }
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  cellLayouts.clear();
});
afterEach(() => {
  act(() => renderer.unmountComponentAtNode(121));
  jest.useRealTimers();
});

it('clears empty data and reports the same items when they return', () => {
  render(['a']);
  layout();
  scroll(0);
  advance();
  expect(onChange).toHaveBeenLastCalledWith(['a']);

  render([]);
  advance();
  expect(onReport).toHaveBeenLastCalledWith({
    viewableItems: [],
    changed: [viewToken('a', 0, false)],
    viewabilityConfig: config,
  });
  expect(onChange).toHaveBeenLastCalledWith([]);

  render(['a']);
  advance(350);
  expect(onReport).toHaveBeenLastCalledWith({
    viewableItems: [viewToken('a')],
    changed: [viewToken('a')],
    viewabilityConfig: config,
  });
  expect(onReport).toHaveBeenCalledTimes(3);
  expect(onChange).toHaveBeenLastCalledWith(['a']);
});

it('clears a viewport even when the previously visible item remains elsewhere in the data', () => {
  render(['a', 'b']);
  layout();
  scroll(100);
  advance();
  expect(onChange).toHaveBeenLastCalledWith(['b']);

  render(['b']);
  advance();
  expect(onReport).toHaveBeenLastCalledWith({
    viewableItems: [],
    changed: [viewToken('b', 1, false)],
    viewabilityConfig: config,
  });
  expect(onChange).toHaveBeenLastCalledWith([]);

  scroll(0);
  advance();
  expect(onChange).toHaveBeenLastCalledWith(['b']);
});

it.each([
  { change: 'replacement without empty data', emptyFor: null },
  { change: 'refill before the next list update', emptyFor: 1 },
  { change: 'refill after an empty list update', emptyFor: 100 },
])('does not report removed items after $change', ({ emptyFor }) => {
  render(['a'], true);
  layout();
  scroll(0);
  advance(100);
  if (emptyFor !== null) {
    render([], true);
    advance(emptyFor);
  }
  render(['b'], true);
  advance(900 - (emptyFor ?? 0));
  expect(onReport).not.toHaveBeenCalled();

  advance(500);
  expect(onReport).toHaveBeenCalledTimes(1);
  expect(onReport).toHaveBeenLastCalledWith({
    viewableItems: [viewToken('b')],
    changed: [viewToken('b')],
    viewabilityConfig: delayedConfig,
  });
  advance();
  expect(onChange).toHaveBeenLastCalledWith(['b']);
});

it('keeps the pending report when scrolling leaves the visible rows unchanged', () => {
  render(['a'], true);
  layout();
  scroll(0);
  advance(500);
  scroll(1);
  advance(500);
  expect(onReport).toHaveBeenCalledTimes(1);
  expect(onReport.mock.calls[0][0].viewableItems).toEqual([viewToken('a')]);
});

it('does not clear visible rows when an earlier empty report expires', () => {
  render(['a'], true);
  layout();
  scroll(0);
  advance(1000);
  expect(onReport.mock.calls[0][0].viewableItems).toEqual([viewToken('a')]);

  scroll(100);
  advance(100);
  scroll(0);
  advance(1000);
  expect(onReport).toHaveBeenCalledTimes(1);
  expect(onChange).toHaveBeenLastCalledWith(['a']);
});
