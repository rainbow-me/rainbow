import { Interface } from '@ethersproject/abi';
import { beforeEach, expect, it, vi } from 'vitest';

import { ChainId } from '@/features/network/types/backendNetworks';
import { getProvider } from '@/handlers/web3';

import { readEnsRecords, readEnsText, resolveEnsAddress } from '../ens';
import { useEnsImageStore } from './imageStore';
import { useEnsRecordsStore } from './recordsStore';

vi.mock('../ens', () => ({ readEnsRecords: vi.fn(), readEnsText: vi.fn(), resolveEnsAddress: vi.fn() }));
vi.mock('@/graphql', () => ({ ensClient: {} }));
vi.mock('@/components/images', () => ({ ImgixImage: { preload: () => undefined } }));
vi.mock('@/handlers/web3', async () => {
  const { StaticJsonRpcProvider } = await import('@ethersproject/providers');
  const provider = new StaticJsonRpcProvider(undefined, 1);
  return { getProvider: () => provider };
});
vi.mock('@/handlers/svgs', () => ({ default: (uri: string) => uri.replace('.svg', '.png') }));

const ADDRESS = '0x2222222222222222222222222222222222222222';
const IMAGE = 'https://example.com/avatar.png';
beforeEach(() => {
  vi.restoreAllMocks();
  vi.mocked(resolveEnsAddress).mockResolvedValue(ADDRESS);
  vi.mocked(readEnsText).mockReset().mockResolvedValue(IMAGE);
  vi.spyOn(getProvider({ chainId: ChainId.mainnet }), 'call').mockRejectedValue(new Error('Unexpected contract read'));
});

it('converts an NFT avatar owned by another address and reads the header independently', async () => {
  const nft = new Interface(['function tokenURI(uint256) view returns (string)', 'function ownerOf(uint256) view returns (address)']);
  const metadata = `data:application/json;base64,${Buffer.from(JSON.stringify({ image: 'https://example.com/avatar.svg' })).toString('base64')}`;
  vi.mocked(getProvider({ chainId: ChainId.mainnet }).call).mockImplementation(async transaction => {
    const { name, args } = nft.parseTransaction({ data: String(await transaction.data) });
    expect(args[0].toString()).toBe('42');
    return nft.encodeFunctionResult(name, [name === 'tokenURI' ? metadata : '0x3333333333333333333333333333333333333333']);
  });
  vi.mocked(readEnsText).mockImplementation(async (_, key) =>
    key === 'avatar' ? `eip155:1/erc721:${ADDRESS}/42` : 'https://example.com/header.png'
  );

  await expect(useEnsImageStore.getState().load({ name: 'alice.eth', field: 'avatar' }, { force: true })).resolves.toBe(IMAGE);
  await expect(useEnsImageStore.getState().load({ name: 'alice.eth', field: 'header' }, { force: true })).resolves.toBe(
    'https://example.com/header.png'
  );
});

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
  const records = await useEnsRecordsStore.getState().load({ name: 'baseline.eth' });
  expect(records?.records).toEqual({ avatar: 'raw avatar record' });
  expect(useEnsImageStore.getState().hasSettled({ name: 'baseline.eth', field: 'avatar' })).toBe(false);
  pending.resolve(null);
  await expect(image).resolves.toBeNull();
});
