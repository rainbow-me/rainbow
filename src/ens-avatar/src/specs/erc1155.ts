import { Buffer } from 'buffer';
import { Contract } from '@ethersproject/contracts';
import { BaseProvider } from '@ethersproject/providers';
import { AvatarRequestOpts } from '..';
import { resolveURI } from '../utils';
import { apiGetUniqueTokenImage } from '@rainbow-me/handlers/opensea-api';

const abi = [
  'function uri(uint256 _id) public view returns (string memory)',
  'function balanceOf(address account, uint256 id) public view returns (uint256)',
];

export default class ERC1155 {
  async getMetadata(
    provider: BaseProvider,
    ownerAddress: string | undefined,
    contractAddress: string,
    tokenID: string,
    opts?: AvatarRequestOpts
  ) {
    const contract = new Contract(contractAddress, abi, provider);
    const [tokenURI, balance] = await Promise.all([
      contract.uri(tokenID),
      ownerAddress && contract.balanceOf(ownerAddress, tokenID),
    ]);
    if (!opts?.allowNonOwnerNFTs && ownerAddress && balance.eq(0)) return null;

    const { uri: resolvedURI, isOnChain, isEncoded } = resolveURI(tokenURI);
    let _resolvedUri = resolvedURI;
    if (isOnChain) {
      if (isEncoded) {
        _resolvedUri = Buffer.from(
          resolvedURI.replace('data:application/json;base64,', ''),
          'base64'
        ).toString();
      }
      return JSON.parse(_resolvedUri);
    }

    const { image_url } = await apiGetUniqueTokenImage(
      contractAddress,
      tokenID
    );
    return { image: image_url };
  }
}
