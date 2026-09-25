import { usePlacementsStore } from './placementsStore';

jest.mock('@react-native-firebase/app', () => ({ getApp: jest.fn() }));
jest.mock('@react-native-firebase/firestore', () => ({
  collection: jest.fn(),
  getFirestore: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: async () => ({
    docs: [
      {
        id: 'cards',
        data: () => ({
          id: 'cards',
          version: 2,
          source: 'polymarket',
          type: 'prediction',
          items: [{ id: 'b' }, null, { id: '' }, { id: 'a' }, { id: 'b' }, { id: 'c' }],
        }),
      },
    ],
  }),
}));

afterAll(() => usePlacementsStore.getState().reset(true));

test('admits each valid item once, preserving placement order', async () => {
  await usePlacementsStore.getState().fetch(undefined, { force: true });

  expect(usePlacementsStore.getState().getPlacement('cards')?.items).toEqual([{ id: 'b' }, { id: 'a' }, { id: 'c' }]);
});
