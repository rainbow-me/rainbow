import React, { act, useEffect, useLayoutEffect, type ReactElement } from 'react';

import { type ReactNativeType } from 'react-native/types_generated/Libraries/Renderer/shims/ReactNativeTypes.d';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { useViewabilityTracker, type ViewabilitySelectors } from '@/framework/ui/hooks/useViewabilityTracker';

const renderer = await vi.importActual<ReactNativeType>('react-native/Libraries/Renderer/implementations/ReactNativeRenderer-dev');

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
  act(() => vi.advanceTimersByTime(250));
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  act(() => renderer.unmountComponentAtNode(111));
  vi.useRealTimers();
});

it('projects only the latest report and suppresses unchanged membership', () => {
  const onChange = vi.fn<(ids: readonly string[]) => void>();
  render(<Tracker onChange={onChange} />);
  onChange.mockClear();

  report({ id: 'old' });
  report({ id: 'a' }, { id: 'b' });
  expect(onChange).not.toHaveBeenCalled();
  settle();
  expect(onChange).toHaveBeenLastCalledWith(['a', 'b']);

  const delivered = Object.freeze(onChange.mock.calls[0][0]);
  report({ id: 'b' }, { id: 'a' }, { id: 'b' });
  settle();
  expect(onChange).toHaveBeenCalledTimes(1);
  report({ id: 'a' });
  settle();
  expect(onChange).toHaveBeenLastCalledWith(['a']);
  expect(delivered).toEqual(['a', 'b']);
});

it('admits child reports through visible parents and retains them while the parent is offscreen', () => {
  const onChange = vi.fn<(ids: readonly string[]) => void>();
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
  const onChange = vi.fn<(ids: readonly string[]) => void>();
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

it('keeps reports received during commit and publishes after the old consumer releases', () => {
  const events: (string | readonly string[])[] = [];
  const first = vi.fn<(ids: readonly string[]) => void>();
  const second = vi.fn((ids: readonly string[]) => events.push(ids));

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

  const replacement = vi.fn<(ids: readonly string[]) => void>();
  render(<Consumer onChange={replacement} id="b" />);
  expect(replacement).toHaveBeenLastCalledWith(['b']);
});

it('cancels pending work before child cleanup can schedule it again', () => {
  const onChange = vi.fn<(ids: readonly string[]) => void>();
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
