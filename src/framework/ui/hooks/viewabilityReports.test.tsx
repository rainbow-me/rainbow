import React, { act, type ReactElement } from 'react';
import {
  FlatList,
  ScrollView,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewProps,
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
let scrollProps: ScrollViewProps;

function renderScrollComponent(props: ScrollViewProps): ReactElement<ScrollViewProps> {
  scrollProps = props;
  return React.createElement(ScrollView, props);
}

function List({ data, delayed = false }: { data: readonly string[]; delayed?: boolean }): ReactElement {
  const { onViewableItemsChanged } = useViewabilityTracker(selectors, onChange);
  return (
    <FlatList
      data={data}
      renderItem={() => null}
      keyExtractor={item => item}
      getItemLayout={(_, index) => ({ index, length: 100, offset: index * 100 })}
      renderScrollComponent={renderScrollComponent}
      onViewableItemsChanged={info => {
        onReport(info.viewableItems.map(token => token.item));
        onViewableItemsChanged(info);
      }}
      viewabilityConfig={delayed ? delayedConfig : config}
    />
  );
}

function render(data: readonly string[], delayed = false): void {
  act(() => renderer.render(<List data={data} delayed={delayed} />, 121, undefined, undefined));
  act(() => scrollProps.onContentSizeChange?.(100, data.length * 100));
}

function scroll(offset: number): void {
  act(() =>
    scrollProps.onScroll?.({
      timeStamp: Date.now(),
      nativeEvent: {
        contentOffset: { x: 0, y: offset },
        contentSize: { width: 100, height: 300 },
        layoutMeasurement: { width: 100, height: 100 },
        zoomScale: 1,
        contentInset: { top: 0, bottom: 0, left: 0, right: 0 },
      },
    } as NativeSyntheticEvent<NativeScrollEvent>)
  );
}

function layout(): void {
  act(() => scrollProps.onLayout?.({ nativeEvent: { layout: { x: 0, y: 0, width: 100, height: 100 } } } as LayoutChangeEvent));
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
  expect(onReport).toHaveBeenLastCalledWith([]);
  expect(onChange).toHaveBeenLastCalledWith([]);

  render(['a']);
  advance(350);
  expect(onReport).toHaveBeenLastCalledWith(['a']);
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
  expect(onReport).toHaveBeenLastCalledWith([]);
  expect(onChange).toHaveBeenLastCalledWith([]);

  scroll(0);
  advance();
  expect(onChange).toHaveBeenLastCalledWith(['b']);
});

it('does not resurrect a pending report after the list becomes empty', () => {
  render(['a'], true);
  layout();
  scroll(0);
  advance(100);
  render([], true);
  advance(100);
  render(['b'], true);
  advance(800);
  expect(onReport).not.toHaveBeenCalled();

  advance(500);
  expect(onReport).toHaveBeenCalledTimes(1);
  expect(onReport).toHaveBeenLastCalledWith(['b']);
  advance();
  expect(onChange).toHaveBeenLastCalledWith(['b']);
});
