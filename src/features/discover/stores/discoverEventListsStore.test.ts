import { discoverEventListsStore } from '@/features/discover/stores/discoverEventListsStore';

beforeEach(() => {
  discoverEventListsStore.setState(discoverEventListsStore.getInitialState());
});

it('publishes membership only when the effective set of events changes', () => {
  const { setList, removeList } = discoverEventListsStore.getState();
  setList('sports', 'games', ['1', '2']);

  const { sections, mountedEventIds } = discoverEventListsStore.getState();
  setList('sports', 'games', ['2', '1', '2']);
  removeList('sports', 'unmounted');
  expect(discoverEventListsStore.getState().sections).toBe(sections);

  setList('sports', 'futures', ['2']);
  expect(discoverEventListsStore.getState().sections.sports?.eventIds).toBe(sections.sports?.eventIds);
  expect(discoverEventListsStore.getState().mountedEventIds).toBe(mountedEventIds);

  removeList('sports', 'games');
  expect(discoverEventListsStore.getState().sections.sports?.eventIds).toEqual(['2']);
  expect(discoverEventListsStore.getState().mountedEventIds).toEqual(new Set(['2']));

  setList('sports', 'futures', []);
  expect(discoverEventListsStore.getState().sections).toEqual({});
  expect(discoverEventListsStore.getState().mountedEventIds.size).toBe(0);
});

it('retains shared events until their last page releases them', () => {
  const { setList, removeList } = discoverEventListsStore.getState();
  setList('sports', 'games', ['1']);
  const mountedEventIds = discoverEventListsStore.getState().mountedEventIds;

  setList('crypto', 'predictions', ['1']);
  removeList('sports', 'games');
  expect(discoverEventListsStore.getState().mountedEventIds).toBe(mountedEventIds);
  expect(discoverEventListsStore.getState().sections.sports).toBeUndefined();

  removeList('crypto', 'predictions');
  expect(discoverEventListsStore.getState().mountedEventIds.size).toBe(0);
});

it('skips collection construction for unchanged list IDs', () => {
  discoverEventListsStore.getState().setList('sports', 'games', ['1', '2']);
  const ids = ['1', '2'];
  const iterate = jest.spyOn(ids, Symbol.iterator);
  const previous = discoverEventListsStore.getState();

  const keys = jest.spyOn(Object, 'keys');
  previous.setList('sports', 'games', ids);
  const keyReads = keys.mock.calls.length;
  keys.mockRestore();

  expect(keyReads).toBe(0);
  expect(iterate).not.toHaveBeenCalled();
  expect(discoverEventListsStore.getState()).toBe(previous);
  iterate.mockRestore();
});
