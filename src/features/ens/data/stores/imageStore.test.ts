import { encodeAbiParameters, encodeFunctionData, erc721Abi, erc1155Abi } from 'viem';
import { polygon } from 'viem/chains';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { readEnsRecords, readEnsText } from '../ens';
import { useEnsImageStore } from './imageStore';
import { useEnsRecordsStore } from './recordsStore';

vi.mock('../ens', () => ({ readEnsRecords: vi.fn(), readEnsText: vi.fn() }));
vi.mock('@/features/network/stores/backendNetworksStore', () => ({
  backendNetworksActions: { getDefaultChains: () => ({ [polygon.id]: polygon }), getChainDefaultRpc: () => 'https://polygon.test' },
}));
vi.mock('@/components/images', () => ({ ImgixImage: { preload: () => undefined } }));
vi.mock('@/handlers/svgs', () => ({ default: (uri: string) => uri.replace('.svg', '.png') }));

const ADDRESS = '0x2222222222222222222222222222222222222222';
const IMAGE = 'https://example.com/avatar.png';
beforeEach(() => {
  vi.mocked(readEnsText).mockReset().mockResolvedValue(IMAGE);
});
afterEach(() => vi.unstubAllGlobals());

it.each(['erc721', 'erc1155'] as const)(
  'resolves %s artwork on the chain in the record without an ownership or image preflight',
  async standard => {
    const inline = JSON.stringify({ image: 'https://example.com/avatar.svg' });
    const tokenUri =
      standard === 'erc721' ? 'data:application/json;base64,' + Buffer.from(inline).toString('base64') : 'https://metadata.test/{id}';
    const calldata =
      standard === 'erc721'
        ? encodeFunctionData({ abi: erc721Abi, functionName: 'tokenURI', args: [26n] })
        : encodeFunctionData({ abi: erc1155Abi, functionName: 'uri', args: [26n] });
    const fetch = vi.fn(async (url: string, init: RequestInit) => {
      if (String(url) === 'https://polygon.test/') {
        const rpc = JSON.parse(String(init.body));
        return Response.json({ jsonrpc: '2.0', id: rpc.id, result: encodeAbiParameters([{ type: 'string' }], [tokenUri]) });
      }
      return Response.json(JSON.parse(inline));
    });
    vi.stubGlobal('fetch', fetch);
    vi.mocked(readEnsText).mockImplementation(async (_, field) => (field === 'avatar' ? `eip155:137/${standard}:${ADDRESS}/26` : IMAGE));
    await expect(useEnsImageStore.getState().load({ name: 'alice.eth', field: 'avatar' }, { force: true })).resolves.toBe(IMAGE);
    await expect(useEnsImageStore.getState().load({ name: 'alice.eth', field: 'header' }, { force: true })).resolves.toBe(IMAGE);
    expect(JSON.parse(String(fetch.mock.calls[0][1].body)).params[0]).toMatchObject({ to: ADDRESS, data: calldata });
    expect(fetch.mock.calls.map(call => String(call[0]))).toEqual(
      standard === 'erc721' ? ['https://polygon.test/'] : ['https://polygon.test/', 'https://metadata.test/' + '1a'.padStart(64, '0')]
    );
  }
);

it('retains an image on lookup failure but clears it when the record is removed', async () => {
  await useEnsImageStore.getState().load({ name: 'alice.eth', field: 'avatar' }, { force: true });
  vi.mocked(readEnsText).mockRejectedValueOnce(new Error('Gateway unavailable'));
  await expect(useEnsImageStore.getState().load({ name: 'alice.eth', field: 'avatar' }, { force: true })).rejects.toThrow(
    'Gateway unavailable'
  );
  expect(useEnsImageStore.getState().get({ name: 'alice.eth', field: 'avatar' })).toBe(IMAGE);
  vi.mocked(readEnsText).mockResolvedValueOnce(null);
  await expect(useEnsImageStore.getState().load({ name: 'alice.eth', field: 'avatar' }, { force: true })).resolves.toBeNull();
  vi.mocked(readEnsText).mockRejectedValueOnce(new Error('Gateway unavailable'));
  await expect(useEnsImageStore.getState().load({ name: 'alice.eth', field: 'avatar' }, { force: true })).rejects.toThrow(
    'Gateway unavailable'
  );
  expect(useEnsImageStore.getState().get({ name: 'alice.eth', field: 'avatar' })).toBeNull();
});

it('makes the record baseline available while image processing is pending', async () => {
  const pending = Promise.withResolvers<string | null>();
  vi.mocked(readEnsText).mockReturnValue(pending.promise);
  vi.mocked(readEnsRecords).mockImplementation(async (_name, keys) => ({
    texts: Object.fromEntries(keys.texts.map(key => [key, key === 'avatar' ? 'raw avatar record' : null])),
    coins: Object.fromEntries(keys.coins.map(key => [key, null])),
    contentHash: null,
  }));
  const image = useEnsImageStore.getState().load({ name: 'baseline.eth', field: 'avatar' }, { force: true });
  const records = await useEnsRecordsStore.getState().load('baseline.eth');
  expect(records?.records).toEqual({ avatar: 'raw avatar record' });
  expect(useEnsImageStore.getState().hasSettled({ name: 'baseline.eth', field: 'avatar' })).toBe(false);
  pending.resolve(null);
  await expect(image).resolves.toBeNull();
});
