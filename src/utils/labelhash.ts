import { keccak256 } from '@ethersproject/keccak256';
import { toUtf8Bytes } from '@ethersproject/strings';
import { normalizeENS } from './ens';

export function encodeLabelhash(hash: string) {
  if (!hash.startsWith('0x')) {
    throw new Error('Expected label hash to start with 0x');
  }

  if (hash.length !== 66) {
    throw new Error('Expected label hash to have a length of 66');
  }

  return `[${hash.slice(2)}]`;
}

export function decodeLabelhash(hash: string) {
  if (!(hash.startsWith('[') && hash.endsWith(']'))) {
    throw Error('Expected encoded labelhash to start and end with square brackets');
  }

  if (hash.length !== 66) {
    throw Error('Expected encoded labelhash to have a length of 66');
  }

  return `${hash.slice(1, -1)}`;
}

export function isEncodedLabelhash(hash: string) {
  return hash.startsWith('[') && hash.endsWith(']') && hash.length === 66;
}

export function isDecrypted(name: string) {
  const nameArray = name.split('.');
  const decrypted = nameArray.reduce((acc, label) => {
    if (acc === false) return false;
    return !isEncodedLabelhash(label);
  }, true);

  return decrypted;
}

export default function labelhash(unnormalisedLabelOrLabelhash: string) {
  if (unnormalisedLabelOrLabelhash === '[root]') {
    return '';
  }
  return isEncodedLabelhash(unnormalisedLabelOrLabelhash)
    ? '0x' + decodeLabelhash(unnormalisedLabelOrLabelhash)
    : keccak256(toUtf8Bytes(normalizeENS(unnormalisedLabelOrLabelhash)));
}
