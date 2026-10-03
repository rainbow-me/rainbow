import { discoverEventListsStore } from '@/features/discover/stores/discoverEventListsStore';

beforeEach(() => discoverEventListsStore.setState(discoverEventListsStore.getInitialState()));

it('retains shared events until the last list releases them, independently for each section', () => {
  const { setList, removeList } = discoverEventListsStore.getState();
  setList('featured', 'cards', ['2', '1', '2']);
  setList('featured', 'more-cards', ['2']);
  setList('crypto', 'cards', ['1']);
  expect(new Set(discoverEventListsStore.getState().sections.featured?.eventIds)).toEqual(new Set(['1', '2']));

  removeList('featured', 'cards');
  expect(discoverEventListsStore.getState().sections.featured?.eventIds).toEqual(['2']);
  setList('featured', 'more-cards', []);
  expect(discoverEventListsStore.getState().sections.featured).toBeUndefined();
  expect(discoverEventListsStore.getState().sections.crypto?.eventIds).toEqual(['1']);

  removeList('crypto', 'cards');
  expect(discoverEventListsStore.getState().sections).toEqual({});
});
