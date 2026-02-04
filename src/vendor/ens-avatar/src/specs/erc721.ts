import { Buffer } from 'buffer';
import { Contract } from '@ethersproject/contracts';
import { BaseProvider } from '@ethersproject/providers';
import { AvatarRequestOpts } from '..';
import { resolveURI } from '../utils';
import svgToPngIfNeeded from '@/handlers/svgs';
import { fetchSimpleHashNFT } from '@/resources/nfts/simplehash';

const abi = [
  'function tokenURI(uint256 tokenId) external view returns (string memory)',
  'function ownerOf(uint256 tokenId) public view returns (address)',
];

export default class ERC721 {
  async getMetadata(
    provider: BaseProvider,
    ownerAddress: string | undefined,
    contractAddress: string,
    tokenID: string,
    opts?: AvatarRequestOpts
  ) {
    const contract = new Contract(contractAddress, abi, provider);
    const [tokenURI, owner] = await Promise.all([contract.tokenURI(tokenID), ownerAddress && contract.ownerOf(tokenID)]);
    if (!opts?.allowNonOwnerNFTs && ownerAddress && owner.toLowerCase() !== ownerAddress.toLowerCase()) {
      return null;
    }

    let image;

    const { uri: resolvedURI, isOnChain, isEncoded } = resolveURI(tokenURI);
    let _resolvedUri = resolvedURI;
    if (isOnChain) {
      if (isEncoded) {
        _resolvedUri = Buffer.from(resolvedURI.replace('data:application/json;base64,', ''), 'base64').toString();
      }
      const data = JSON.parse(_resolvedUri);
      image = svgToPngIfNeeded(data?.image, false);
    }

    try {
      const data = await fetchSimpleHashNFT(contractAddress, tokenID);
      image = svgToPngIfNeeded(data?.previews?.image_medium_url, false);
    } catch (error) {
      throw new Error('no image found');
    }
    return { image };
  }
}
