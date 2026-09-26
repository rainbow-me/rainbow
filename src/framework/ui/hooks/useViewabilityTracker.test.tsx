import React, { act, useEffect, useLayoutEffect, type ReactElement } from 'react';

import { type ReactNativeType } from 'react-native/types_generated/Libraries/Renderer/shims/ReactNativeTypes.d';

import { useViewabilityTracker, type ViewabilitySelectors } from '@/framework/ui/hooks/useViewabilityTracker';

const renderer = jest.requireActual<ReactNativeType>('react-native/Libraries/Renderer/implementations/ReactNativeRenderer-dev');

type Row = { id?: string; childKey?: string };
const selectors: ViewabilitySelectors<Row> = {
  getId: item => item.id,
  getChildKey: item => item.childKey,
};
let handlers: ReturnType<typeof useViewabilityTracker<Row>>;

function Tracker({
  onChange,
  select = selectors,
  child = false,
}: {
  onChange: (ids: readonly string[]) => void;
  select?: ViewabilitySelectors<Row>;
  child?: boolean;
}): ReactElement | null {
  handlers = useViewabilityTracker(select, onChange);
  return child ? <ChildReport /> : null;
}

function ChildReport(): null {
  useEffect(() => {
    handlers.onChildViewableItemsChanged('carousel', [{ item: 'a' }]);
    return () => handlers.onChildViewableItemsChanged('carousel', []);
  }, []);
  return null;
}

function render(element: ReactElement): void {
  act(() => renderer.render(element, 111, undefined, undefined));
}

function report(...viewableItems: Row[]): void {
  act(() => handlers.onViewableItemsChanged({ viewableItems }));
}

function settle(): void {
  act(() => jest.advanceTimersByTime(250));
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  act(() => renderer.unmountComponentAtNode(111));
  jest.useRealTimers();
});

it('projects only the latest report and suppresses unchanged membership', () => {
  const onChange = jest.fn();
  const getId = jest.fn(selectors.getId);
  render(<Tracker select={{ getId }} onChange={onChange} />);
  onChange.mockClear();

  report({ id: 'old' });
  report({ id: 'a' }, { id: 'b' });
  expect(getId).not.toHaveBeenCalled();
  expect(onChange).not.toHaveBeenCalled();
  settle();
  expect(onChange).toHaveBeenLastCalledWith(['a', 'b']);
  expect(getId).toHaveBeenCalledTimes(2);

  report({ id: 'b' }, { id: 'a' }, { id: 'b' });
  settle();
  expect(onChange).toHaveBeenCalledTimes(1);
});

it('admits child reports through visible parents and retains them while the parent is offscreen', () => {
  const onChange = jest.fn();
  render(<Tracker onChange={onChange} />);
  act(() => handlers.onChildViewableItemsChanged('carousel', [{ item: 'a' }, { item: 'b' }]));
  report({ id: 'a' }, { childKey: 'carousel' });
  settle();
  expect(onChange).toHaveBeenLastCalledWith(['a', 'b']);

  report({ id: 'a' });
  settle();
  onChange.mockClear();
  act(() => handlers.onChildViewableItemsChanged('carousel', [{ item: 'c' }]));
  settle();
  expect(onChange).not.toHaveBeenCalled();

  report({ childKey: 'carousel' });
  settle();
  expect(onChange).toHaveBeenLastCalledWith(['c']);
  act(() => handlers.onChildViewableItemsChanged('carousel', []));
  settle();
  expect(onChange).toHaveBeenLastCalledWith([]);
});

it('clears immediately and cancels an older pending report', () => {
  const onChange = jest.fn();
  render(<Tracker onChange={onChange} />);
  report({ id: 'a' });
  settle();
  report({ id: 'b' });
  report();
  expect(onChange).toHaveBeenLastCalledWith([]);
  const calls = onChange.mock.calls.length;
  settle();
  expect(onChange).toHaveBeenCalledTimes(calls);
});

it('keeps handlers stable and transfers the latest snapshot to a replacement consumer', () => {
  const first = jest.fn();
  const second = jest.fn();
  render(<Tracker onChange={first} />);
  const original = handlers;
  report({ id: 'a' });
  settle();
  report({ id: 'b' });
  render(<Tracker onChange={second} />);
  expect(handlers).toBe(original);
  expect(second).toHaveBeenLastCalledWith(['b']);
  settle();
  expect(first).toHaveBeenLastCalledWith(['a']);
  expect(second).toHaveBeenCalledTimes(1);
});

it('delivers the existing ID array to a replacement consumer', () => {
  const first = jest.fn();
  const second = jest.fn();
  render(<Tracker onChange={first} />);
  report({ id: 'a' }, { id: 'b' });
  settle();
  const ids = Object.freeze(first.mock.calls.at(-1)?.[0]);

  render(<Tracker onChange={second} />);
  expect(second).toHaveBeenCalledTimes(1);
  expect(second.mock.calls[0][0]).toBe(ids);
});

it('trims matching prefixes without mutating delivered arrays and reuses the empty result', () => {
  const onChange = jest.fn();
  render(<Tracker onChange={onChange} />);
  const empty = onChange.mock.calls[0][0];
  report({ id: 'a' }, { id: 'b' }, { id: 'c' });
  settle();
  const original = Object.freeze(onChange.mock.calls.at(-1)?.[0]);

  report({ id: 'a' }, { id: 'b' });
  settle();
  expect(onChange).toHaveBeenLastCalledWith(['a', 'b']);
  expect(original).toEqual(['a', 'b', 'c']);

  const calls = onChange.mock.calls.length;
  report({ id: 'b' }, { id: 'a' }, { id: 'b' });
  settle();
  expect(onChange).toHaveBeenCalledTimes(calls);

  report();
  expect(onChange.mock.calls.at(-1)?.[0]).toBe(empty);
});

it('keeps reports received during commit and publishes after the old consumer releases', () => {
  const events: (string | readonly string[])[] = [];
  const first = jest.fn();
  const second = jest.fn((ids: readonly string[]) => events.push(ids));

  function LayoutReport({ id }: { id: string }): null {
    useLayoutEffect(() => handlers.onViewableItemsChanged({ viewableItems: [{ id }] }), [id]);
    return null;
  }

  function Consumer({ onChange, id }: { onChange: (ids: readonly string[]) => void; id: string }): ReactElement {
    useEffect(
      () => () => {
        events.push('release');
      },
      [onChange]
    );
    handlers = useViewabilityTracker(selectors, onChange);
    return <LayoutReport id={id} />;
  }

  render(<Consumer onChange={first} id="a" />);
  expect(first).toHaveBeenLastCalledWith(['a']);
  render(<Consumer onChange={second} id="b" />);
  expect(events).toEqual(['release', ['b']]);
  settle();
  expect(second).toHaveBeenCalledTimes(1);
});

it('cancels pending work before child cleanup can schedule it again', () => {
  const onChange = jest.fn();
  render(<Tracker onChange={onChange} child />);
  report({ childKey: 'carousel' });
  settle();
  expect(onChange).toHaveBeenLastCalledWith(['a']);
  report({ id: 'pending' });
  onChange.mockClear();
  act(() => renderer.unmountComponentAtNode(111));
  settle();
  expect(onChange).not.toHaveBeenCalled();
});
