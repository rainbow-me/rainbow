import { CID } from 'multiformats/cid';
import { createClient, erc721Abi, erc1155Abi, http } from 'viem';
import { readContract } from 'viem/actions';

import { backendNetworksActions } from '@/features/network/stores/backendNetworksStore';
import { rainbowFetch } from '@/framework/data/http/rainbowFetch';
import svgToPngIfNeeded from '@/handlers/svgs';

import { parseNftRecord } from '../core/nftRecord';

const IPFS_GATEWAY = 'https://ipfs.filebase.io';

/**
 * Converts an avatar or header record to a display URI. NFT references may
 * point to a different chain and do not require the name holder to own the NFT.
 */
export async function resolveImageRecord(record: string, signal?: AbortSignal): Promise<string | null> {
  const nft = parseNftRecord(record);
  if (!nft) return imageUri(record);

  const chain = backendNetworksActions.getDefaultChains()[nft.chainId];
  if (!chain) return null;

  const client = createClient({
    chain,
    transport: http(backendNetworksActions.getChainDefaultRpc(chain.id), { fetchOptions: { signal } }),
  });

  let uri: string;
  if (nft.standard === 'erc721') {
    uri = await readContract(client, { address: nft.contractAddress, abi: erc721Abi, functionName: 'tokenURI', args: [nft.tokenId] });
  } else {
    uri = await readContract(client, { address: nft.contractAddress, abi: erc1155Abi, functionName: 'uri', args: [nft.tokenId] });
    uri = uri.replaceAll('{id}', nft.tokenId.toString(16).padStart(64, '0'));
  }

  const metadata = await readMetadata(uri, signal);
  if (!metadata || typeof metadata !== 'object' || !('image' in metadata) || typeof metadata.image !== 'string') return null;

  const image = imageUri(metadata.image);
  return image && (svgToPngIfNeeded(image, false) ?? null);
}

async function readMetadata(uri: string, signal?: AbortSignal): Promise<unknown> {
  if (uri.startsWith('{')) return JSON.parse(uri);

  const data = /^data:application\/json(?:;charset=[\w-]+)?(;base64)?,/i.exec(uri);
  if (data) {
    const payload = uri.slice(data[0].length);
    return JSON.parse(data[1] ? Buffer.from(payload, 'base64').toString('utf8') : decodeURIComponent(payload));
  }

  const url = remoteUri(uri);
  if (!url) return null;

  const metadata = (await rainbowFetch<unknown>(url, { credentials: 'omit', signal })).data;
  return typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
}

function imageUri(uri: string): string | null {
  return uri.startsWith('data:image/') ? uri : remoteUri(uri);
}

function remoteUri(uri: string): string | null {
  if (/^https?:\/\//i.test(uri)) return uri;

  const gatewayPath = uri.replace(/^(ipfs|ipns):\/\/(?:\1\/)?/i, '/$1/');
  if (/^\/(ipfs|ipns)\/[^/]/i.test(gatewayPath)) return IPFS_GATEWAY + gatewayPath;

  try {
    CID.parse(uri.split('/', 1)[0]);
    return `${IPFS_GATEWAY}/ipfs/${uri}`;
  } catch {
    return null;
  }
}
