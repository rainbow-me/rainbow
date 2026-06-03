import { destroyStore } from '@storesjs/stores';

import { createPreparedCallsStore } from './preparedCallsStore';

type TestParams = {
  id: string;
};

describe('createPreparedCallsStore', () => {
  it('uses the active cached preparation once, then refreshes repeated submissions for the same params', async () => {
    const fetcher = jest
      .fn<Promise<string>, [TestParams]>()
      .mockResolvedValueOnce('prepared:a:cached')
      .mockResolvedValueOnce('prepared:a:fresh');
    const store = createPreparedCallsStore<string, TestParams>(fetcher);

    await store.getState().fetch({ id: 'a' });

    await expect(store.getState().getPreparedCalls({ id: 'a' })).resolves.toBe('prepared:a:cached');
    await expect(store.getState().getPreparedCalls({ id: 'a' })).resolves.toBe('prepared:a:fresh');

    expect(fetcher).toHaveBeenCalledTimes(2);

    destroyStore(store, { clearQueryCache: true });
  });
});
