import { CID } from 'multiformats/cid';
import urlJoin from 'url-join';

const IPFS_SUBPATH = '/ipfs/';
const IPNS_SUBPATH = '/ipns/';
const ipfsRegex = /(ipfs:\/|ipns:\/)?(\/)?(ipfs\/|ipns\/)?([\w\-.]+)(\/.*)?/;
const base64Regex = /^data:([a-zA-Z\-/+]*);base64,([^"].*)/;
const dataURIRegex = /^data:([a-zA-Z\-/+]*)?(;[a-zA-Z0-9].*)?(,)/;

export class BaseError extends Error {
  __proto__: Error;
  constructor(message?: string) {
    const trueProto = new.target.prototype;
    super(message);

    this.__proto__ = trueProto;
  }
}

// simple assert without nested check
function assert(condition: any, message: string) {
  if (!condition) {
    throw message;
  }
}

export class NFTURIParsingError extends BaseError {}

export function isCID(hash: any) {
  // check if given string or object is a valid IPFS CID
  try {
    if (typeof hash === 'string') {
      return Boolean(CID.parse(hash));
    }

    return Boolean(CID.asCID(hash));
  } catch (_error) {
    return false;
  }
}

export function parseNFT(uri: string, seperator: string = '/') {
  // parse valid nft spec (CAIP-22/CAIP-29)
  // @see: https://github.com/ChainAgnostic/CAIPs/tree/master/CAIPs
  try {
    assert(uri, 'parameter URI cannot be empty');

    if (uri.startsWith('did:nft:')) {
      // convert DID to CAIP
      uri = uri.replace('did:nft:', '').replace(/_/g, '/');
    }

    const [reference, asset_namespace, tokenID] = uri.split(seperator);
    const [, chainID] = reference.split(':');
    const [namespace, contractAddress] = asset_namespace.split(':');

    assert(chainID, 'chainID not found');
    assert(contractAddress, 'contractAddress not found');
    assert(namespace, 'namespace not found');
    assert(tokenID, 'tokenID not found');

    return {
      chainID: Number(chainID),
      contractAddress,
      namespace: namespace.toLowerCase(),
      tokenID,
    };
  } catch (error) {
    throw new NFTURIParsingError(`${(error as Error).message} - ${uri}`);
  }
}

export function resolveURI(uri: string, customGateway?: string): { uri: string; isOnChain: boolean; isEncoded: boolean } {
  // resolves uri based on its' protocol
  const isEncoded = base64Regex.test(uri);
  if (isEncoded || uri.startsWith('http')) {
    return { isEncoded, isOnChain: isEncoded, uri };
  }

  const ipfsGateway = customGateway || 'https://cloudflare-ipfs.com';
  const ipfsRegexpResult = uri.match(ipfsRegex);
  const matches = ipfsRegexpResult || [];
  const protocol = matches?.[1] || '';
  const subpath = matches?.[3] || '';
  const target = matches?.[4] || '';
  const subtarget = matches?.[5] || '';
  if ((protocol === 'ipns:/' || subpath === 'ipns/') && target) {
    return {
      isEncoded: false,
      isOnChain: false,
      uri: urlJoin(ipfsGateway, IPNS_SUBPATH, target, subtarget),
    };
  } else if (isCID(target)) {
    // Assume that it's a regular IPFS CID and not an IPNS key
    return {
      isEncoded: false,
      isOnChain: false,
      uri: urlJoin(ipfsGateway, IPFS_SUBPATH, target, subtarget),
    };
  } else {
    // we may want to throw error here
    return {
      isEncoded: false,
      isOnChain: true,
      uri: uri.replace(dataURIRegex, ''),
    };
  }
}

export interface ImageURIOpts {
  metadata: any;
  customGateway?: string;
  jsdomWindow?: any;
}

export function getImageURI({ metadata, customGateway }: ImageURIOpts) {
  // retrieves image uri from metadata, if image is onchain then convert to base64
  const { image, image_url, image_data } = metadata;

  const _image = image || image_url || image_data;
  if (!_image) return null;

  const { uri: parsedURI } = resolveURI(_image, customGateway);

  if (parsedURI.startsWith('data:') || parsedURI.startsWith('http')) {
    return parsedURI;
  }
  return null;
}
