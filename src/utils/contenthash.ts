import contentHash from '@ensdomains/content-hash';
import { isHexString } from '@/handlers/web3';

const supportedCodecs = ['ipns-ns', 'ipfs-ns', 'swarm-ns', 'onion', 'onion3', 'skynet-ns', 'arweave-ns'];

function matchProtocol(text: string) {
  return text.match(/^(ipfs|sia|ipns|bzz|onion|onion3|arweave):\/\/(.*)/) || text.match(/\/(ipfs)\/(.*)/) || text.match(/\/(ipns)\/(.*)/);
}

export function encodeContenthash(text: string) {
  let content, contentType;
  let encoded = '';
  let error;
  if (text) {
    let matched = matchProtocol(text);
    if (matched) {
      contentType = matched[1];
      content = matched[2];
      try {
        if (contentType === 'ipfs') {
          if (content?.length >= 4) {
            encoded = '0x' + contentHash.encode('ipfs-ns', content);
          }
        } else if (contentType === 'ipns') {
          encoded = '0x' + contentHash.encode('ipns-ns', content);
        } else if (contentType === 'bzz') {
          if (content?.length >= 4) {
            encoded = '0x' + contentHash.fromSwarm(content);
          }
        } else if (contentType === 'onion') {
          if (content?.length === 16) {
            encoded = '0x' + contentHash.encode('onion', content);
          }
        } else if (contentType === 'onion3') {
          if (content?.length === 56) {
            encoded = '0x' + contentHash.encode('onion3', content);
          }
        } else if (contentType === 'sia') {
          if (content?.length === 46) {
            encoded = '0x' + contentHash.encode('skynet-ns', content);
          }
        } else if (contentType === 'arweave') {
          if (content?.length === 43) {
            encoded = '0x' + contentHash.encode('arweave-ns', content);
          }
        }
      } catch (err) {
        const errorMessage = 'Error encoding content hash';
        error = errorMessage;
      }
    }
  }
  return { encoded, error };
}

export function isValidContenthash(encoded: string) {
  try {
    const codec = contentHash.getCodec(encoded);
    return isHexString(encoded) && supportedCodecs.includes(codec);
  } catch (e) {
    return false;
  }
}

export default {
  encodeContenthash,
  isValidContenthash,
};
