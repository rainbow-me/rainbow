import { Interface } from '@ethersproject/abi';
import { beforeEach, expect, it, vi } from 'vitest';

import { ChainId } from '@/features/network/types/backendNetworks';
import { getProvider } from '@/handlers/web3';

import { readEnsText, resolveEnsAddress } from '../data/ens';
import { fetchENSImage } from './fetchENSImage';

const { cache } = vi.hoisted(() => ({ cache: new Map<string, unknown>() }));
vi.mock('../data/ens', () => ({ readEnsText: vi.fn(), resolveEnsAddress: vi.fn() }));
vi.mock('@/components/images', () => ({ ImgixImage: { preload: () => undefined } }));
vi.mock('@/handlers/web3', async () => {
  const { StaticJsonRpcProvider } = await import('@ethersproject/providers');
  const provider = new StaticJsonRpcProvider(undefined, 1);
  return { getProvider: () => provider };
});
vi.mock('@/handlers/svgs', () => ({ default: (uri: string) => uri.replace('.svg', '.png') }));
vi.mock('./localStorage', () => ({
  getENSData: async (type: string, name: string) => cache.get(`${type}:${name}`),
  saveENSData: (type: string, name: string, value: unknown) => cache.set(`${type}:${name}`, value),
}));

const ADDRESS = '0x2222222222222222222222222222222222222222';
const IMAGE = 'https://example.com/avatar.png';
beforeEach(() => {
  vi.restoreAllMocks();
  cache.clear();
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

  await expect(fetchENSImage('avatar', 'alice.eth')).resolves.toEqual({ imageUrl: IMAGE });
  await expect(fetchENSImage('header', 'alice.eth')).resolves.toEqual({ imageUrl: 'https://example.com/header.png' });
});

it('retains an image on lookup failure but clears it when the record is removed', async () => {
  await fetchENSImage('avatar', 'alice.eth');
  vi.mocked(readEnsText).mockRejectedValueOnce(new Error('Gateway unavailable'));
  await expect(fetchENSImage('avatar', 'alice.eth')).resolves.toEqual({ imageUrl: IMAGE });
  vi.mocked(readEnsText).mockResolvedValueOnce(null);
  await expect(fetchENSImage('avatar', 'alice.eth')).resolves.toEqual({ imageUrl: null });
  vi.mocked(readEnsText).mockRejectedValueOnce(new Error('Gateway unavailable'));
  await expect(fetchENSImage('avatar', 'alice.eth')).resolves.toEqual({ imageUrl: null });
});
