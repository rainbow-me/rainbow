import { afterAll, expect, test, vi } from 'vitest';

import { usePlacementsStore } from './placementsStore';

const { mockFirestoreDocuments } = await vi.hoisted(() => import('../../../../config/test/firebase'));

afterAll(() => usePlacementsStore.getState().reset(true));

test('admits each valid item once, preserving placement order', async () => {
  mockFirestoreDocuments.set('placements/cards', {
    id: 'cards',
    version: 2,
    source: 'polymarket',
    type: 'prediction',
    items: [{ id: 'b' }, null, { id: '' }, { id: 'a' }, { id: 'b' }, { id: 'c' }],
  });
  await usePlacementsStore.getState().fetch(undefined, { force: true });
  expect(usePlacementsStore.getState().getPlacement('cards')?.items).toEqual([{ id: 'b' }, { id: 'a' }, { id: 'c' }]);
});
