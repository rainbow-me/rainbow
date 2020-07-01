import { toChecksumAddress } from '../handlers/web3';

export default function getUrlForTrustIconFallback(address) {
  const checksummedAddress = toChecksumAddress(address);
  return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${checksummedAddress}/logo.png`;
}
