import { decodeFunctionData, zeroAddress } from 'viem';
import { namehash } from 'viem/ens';
import { expect, it, vi } from 'vitest';

import { ensClient } from '@/graphql';

import { legacyAbi } from './contracts';
import { readEnsRecords } from './ens';
import { getLegacyRecordClears } from './resolver';

vi.mock('@/graphql', () => ({ ensClient: { getResolverKeys: vi.fn() } }));
vi.mock('./ens', () => ({ readEnsRecords: vi.fn() }));

it('clears indexed coin types and text keys independently of their display representation', async () => {
  vi.mocked(ensClient.getResolverKeys).mockResolvedValue({ resolvers: [{ texts: ['ETH'], coinTypes: ['12345'] }] });
  vi.mocked(readEnsRecords).mockResolvedValue({ texts: {}, coins: { 60: zeroAddress }, contentHash: null });
  const node = namehash('alice.eth');
  const calls = await getLegacyRecordClears('alice.eth', zeroAddress);
  expect(calls.map(data => decodeFunctionData({ abi: legacyAbi, data }))).toEqual([
    { functionName: 'setText', args: [node, 'ETH', ''] },
    { functionName: 'setAddr', args: [node, 12345n, '0x'] },
    { functionName: 'setAddr', args: [node, 60n, zeroAddress] },
  ]);
});
