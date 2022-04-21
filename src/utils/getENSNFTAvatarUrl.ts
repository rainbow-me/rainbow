import isENSNFTRecord from './isENSNFTRecord';
import parseENSNFTRecord from './parseENSNFTRecord';
import { UniqueAsset } from '@rainbow-me/entities';

// Gets the ENS NFT `avatarUrl` from the record `avatar`
export default function getENSNFTAvatarUrl(
  uniqueTokens: UniqueAsset[],
  avatar?: string
) {
  let avatarUrl;
  if (avatar) {
    const isNFTAvatar = isENSNFTRecord(avatar);
    if (isNFTAvatar) {
      const { contractAddress, tokenId } = parseENSNFTRecord(avatar);
      const uniqueToken = uniqueTokens.find(
        token =>
          token.asset_contract.address === contractAddress &&
          token.id === tokenId
      );
      if (uniqueToken?.image_url) {
        avatarUrl = uniqueToken?.image_url;
      } else if (uniqueToken?.image_thumbnail_url) {
        avatarUrl = uniqueToken?.image_thumbnail_url;
      }
    } else if (
      avatar.startsWith('http') ||
      (avatar.startsWith('/') && !avatar.match(/^\/(ipfs|ipns)/))
    ) {
      avatarUrl = avatar;
    }
  }
  return avatarUrl;
}
