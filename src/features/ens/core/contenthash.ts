import contentHash from '@ensdomains/content-hash';
import { type Hex } from 'viem';

/**
 * Encodes a supported content URL for an ENS record. Invalid input returns null.
 */
export function encodeContenthash(value: string): Hex | null {
  const match = value.match(/^(ipfs|sia|ipns|bzz|onion|onion3|arweave):\/\/(.*)/) || value.match(/\/(ipfs|ipns)\/(.*)/);
  if (!match) return null;
  const protocol = match[1];
  const content = match[2];
  try {
    switch (protocol) {
      case 'ipfs':
        return content.length >= 4 ? `0x${contentHash.encode('ipfs-ns', content)}` : null;
      case 'ipns':
        return `0x${contentHash.encode('ipns-ns', content)}`;
      case 'bzz':
        return content.length >= 4 ? `0x${contentHash.fromSwarm(content)}` : null;
      case 'onion':
        return content.length === 16 ? `0x${contentHash.encode('onion', content)}` : null;
      case 'onion3':
        return content.length === 56 ? `0x${contentHash.encode('onion3', content)}` : null;
      case 'sia':
        return content.length === 46 ? `0x${contentHash.encode('skynet-ns', content)}` : null;
      case 'arweave':
        return content.length === 43 ? `0x${contentHash.encode('arweave-ns', content)}` : null;
      default:
        return null;
    }
  } catch {
    return null;
  }
}
