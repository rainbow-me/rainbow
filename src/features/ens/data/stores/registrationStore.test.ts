import { beforeEach, expect, it, vi } from 'vitest';

import { time } from '@/framework/core/utils/time';

import { getChangedRecords } from '../../core/records';
import { useEnsRegistrationStore as store } from './registrationStore';

const ALICE = '0x1111111111111111111111111111111111111111';
const BOB = '0x2222222222222222222222222222222222222222';
const commitment = {
  name: 'alice.eth',
  duration: 31536000,
  ownerAddress: ALICE,
  salt: 'original secret',
  rentPrice: '100',
  commitTransactionHash: 'original transaction',
  records: { description: 'saved draft' },
};

beforeEach(() => {
  store.setState({ current: null, registrations: {} });
});

it('updates the original wallet and name after navigation changes', () => {
  store.getState().start(ALICE, 'alice.eth', 'CREATE');
  store.getState().update(ALICE, 'alice.eth', commitment);
  store.getState().start(BOB, 'bob.eth', 'CREATE');
  store.getState().update(ALICE, 'alice.eth', { commitTransactionConfirmedAt: 123 });

  expect(store.getState().current).toEqual({ accountAddress: BOB, name: 'bob.eth' });
  expect(store.getState().registrations[ALICE]['alice.eth']).toEqual({
    ...commitment,
    mode: 'CREATE',
    commitTransactionConfirmedAt: 123,
  });
  expect(store.getState().registrations[BOB]['bob.eth']).toEqual({ name: 'bob.eth', mode: 'CREATE' });
});

it('adopts an edit baseline once and preserves typed changes across refreshes', () => {
  store.getState().start(ALICE, 'alice.eth', 'EDIT');
  store.getState().initializeRecords(ALICE, 'alice.eth', { description: 'original' });
  store.getState().update(ALICE, 'alice.eth', { records: { description: 'typed' } });
  store.getState().initializeRecords(ALICE, 'alice.eth', { description: 'refreshed' });
  expect(store.getState().registrations[ALICE]['alice.eth']).toMatchObject({
    initialRecords: { description: 'original' },
    records: { description: 'typed' },
  });
  store.getState().clear();
  store.getState().start(ALICE, 'alice.eth', 'EDIT');
  store.getState().initializeRecords(ALICE, 'alice.eth', { description: 'new session' });
  expect(store.getState().registrations[ALICE]['alice.eth'].records).toEqual({ description: 'new session' });
});

it('persists submitted commitments without unsent drafts or navigation state', async () => {
  store.getState().start(ALICE, 'alice.eth', 'CREATE');
  store.getState().update(ALICE, 'alice.eth', commitment);
  store.getState().start(BOB, 'unsent.eth', 'CREATE');

  await vi.waitFor(
    async () => {
      const saved = await store.persist.getOptions().storage?.getItem('ensRegistrations');
      expect(saved?.state).toEqual({ registrations: { [ALICE]: { 'alice.eth': { ...commitment, mode: 'CREATE' } } } });
    },
    { timeout: time.seconds(2) }
  );
});

it('derives actual record writes without inventing deletions for absent values', () => {
  expect(getChangedRecords({ description: 'edited', url: '' }, { description: 'original', url: 'https://example.com' })).toEqual({
    description: 'edited',
    url: '',
  });
  expect(getChangedRecords({ name: 'Alice' }, { 'me.rainbow.displayName': 'Alice' })).toEqual({
    'name': 'Alice',
    'me.rainbow.displayName': '',
  });
  expect(getChangedRecords({ description: '' }, { description: '', contenthash: undefined })).toEqual({});
});
