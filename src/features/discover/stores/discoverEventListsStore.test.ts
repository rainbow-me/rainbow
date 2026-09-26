import { discoverEventListsStore } from '@/features/discover/stores/discoverEventListsStore';

beforeEach(() => {
  discoverEventListsStore.setState(discoverEventListsStore.getInitialState());
});

it('publishes membership only when the effective set of events changes', () => {
  const { setList, removeList } = discoverEventListsStore.getState();
  setList('featured', 'cards', ['2', '1']);

  const { sections } = discoverEventListsStore.getState();
  expect(sections.featured?.eventIds).toEqual(['1', '2']);
  setList('featured', 'cards', ['2', '1', '2']);
  removeList('featured', 'unmounted');
  expect(discoverEventListsStore.getState().sections).toBe(sections);

  setList('featured', 'more-cards', ['2']);
  expect(discoverEventListsStore.getState().sections.featured?.eventIds).toBe(sections.featured?.eventIds);

  removeList('featured', 'cards');
  expect(discoverEventListsStore.getState().sections.featured?.eventIds).toEqual(['2']);

  setList('featured', 'more-cards', []);
  expect(discoverEventListsStore.getState().sections).toEqual({});
});

it('keeps each page’s membership independent', () => {
  const { setList, removeList } = discoverEventListsStore.getState();
  setList('featured', 'cards', ['1']);

  setList('crypto', 'predictions', ['1']);
  const crypto = discoverEventListsStore.getState().sections.crypto;
  removeList('featured', 'cards');
  expect(discoverEventListsStore.getState().sections.featured).toBeUndefined();
  expect(discoverEventListsStore.getState().sections.crypto).toBe(crypto);

  removeList('crypto', 'predictions');
  expect(discoverEventListsStore.getState().sections).toEqual({});
});

it('skips collection construction for unchanged list IDs', () => {
  discoverEventListsStore.getState().setList('featured', 'cards', ['1', '2']);
  const ids = ['1', '2'];
  const iterate = jest.spyOn(ids, Symbol.iterator);
  const previous = discoverEventListsStore.getState();

  previous.setList('featured', 'cards', ids);

  expect(iterate).not.toHaveBeenCalled();
  expect(discoverEventListsStore.getState()).toBe(previous);
  iterate.mockRestore();
});
