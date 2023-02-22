import { Buffer } from 'buffer';
import { Contract } from '@ethersproject/contracts';
import { BaseProvider } from '@ethersproject/providers';
import { AvatarRequestOpts } from '..';
import { resolveURI } from '../utils';
import { UniqueAsset } from '@/entities';
import { apiGetAccountUniqueToken } from '@/handlers/opensea-api';
import { getNFTByTokenId } from '@/handlers/simplehash';
import svgToPngIfNeeded from '@/handlers/svgs';
import { NetworkTypes } from '@/utils';

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

    let image;

    const { uri: resolvedURI, isOnChain, isEncoded } = resolveURI(tokenURI);
    let _resolvedUri = resolvedURI;
    if (isOnChain) {
      if (isEncoded) {
        _resolvedUri = Buffer.from(
          resolvedURI.replace('data:application/json;base64,', ''),
          'base64'
        ).toString();
      }
      const data = JSON.parse(_resolvedUri);
      image = svgToPngIfNeeded(data?.image, false);
    }

    try {
      const data: UniqueAsset = await apiGetAccountUniqueToken(
        NetworkTypes.mainnet,
        contractAddress,
        tokenID
      );
      image = svgToPngIfNeeded(data?.image_url, false) || data?.lowResUrl;
    } catch (error) {
      const data = await getNFTByTokenId({ contractAddress, tokenId: tokenID });
      image = data?.previews?.image_medium_url;
      if (!image) throw new Error('no image found');
    }
    return { image };
  }
}
