import isENSNFTAvatar from './isENSNFTAvatar';
import parseENSNFTAvatar from './parseENSNFTAvatar';
import { UniqueAsset } from '@rainbow-me/entities';

// Gets the ENS NFT `avatarUrl` from the record `avatar`
export default function getENSNFTAvatarUrl(
  uniqueTokens: UniqueAsset[],
  avatar?: string
) {
  let avatarUrl;
  if (avatar) {
    const isNFTAvatar = isENSNFTAvatar(avatar);
    if (isNFTAvatar) {
      const { contractAddress, tokenId } = parseENSNFTAvatar(avatar);
      const uniqueToken = uniqueTokens.find(
        token =>
          token.asset_contract.address === contractAddress &&
          token.id === tokenId
      );
      if (uniqueToken?.image_thumbnail_url) {
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
