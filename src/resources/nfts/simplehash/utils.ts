import { AssetType, UniqueAsset } from '@/entities';
import { ENS_NFT_CONTRACT_ADDRESS, POAP_NFT_ADDRESS } from '@/references';
import { convertRawAmountToRoundedDecimal } from '@/helpers/utilities';
import { handleNFTImages } from '@/utils/handleNFTImages';
import { NftTokenType, SimpleHashNft } from '@/graphql/__generated__/arc';
import { Network } from '@/state/backendNetworks/types';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { Address } from 'viem';

/**
 * @deprecated Should not use this and instead use parseUniqueAsset: https://github.com/rainbow-me/rainbow/blob/2559ee2a5924404de5e723fb11a8e3723c98842d/src/resources/nfts/utils.ts#L75
 * Maps a `SimpleHashNFT` to a `UniqueAsset`.
 * @param nft `SimpleHashNFT`
 * @returns `UniqueAsset`
 */
export function simpleHashNFTToUniqueAsset(nft: SimpleHashNft, address: string): UniqueAsset {
  const chainsIdByName = useBackendNetworksStore.getState().getChainsIdByName();

  const collection = nft.collection;
  const lowercasedContractAddress = nft.contract_address?.toLowerCase();

  const { highResUrl: imageUrl, lowResUrl } = handleNFTImages({
    originalUrl: nft.image_url ?? nft.extra_metadata?.image_original_url,
    previewUrl: nft.previews?.image_small_url,
    mimeType: nft.image_properties?.mime_type,
  });

  const marketplace = nft.collection.marketplace_pages?.[0];
  const floorPrice = collection?.floor_prices?.find(
    floorPrice => floorPrice?.marketplace_id === 'opensea' && floorPrice?.payment_token?.payment_token_id === 'ethereum.native'
  );

  const isENS = lowercasedContractAddress === ENS_NFT_CONTRACT_ADDRESS;
  const isPoap = nft.contract_address.toLowerCase() === POAP_NFT_ADDRESS;
  const standard = nft.contract?.type;

  return {
    type: isENS ? AssetType.ens : isPoap ? AssetType.poap : AssetType.nft,
    standard: standard as NftTokenType,
    images: {
      highResUrl: imageUrl,
      lowResUrl: lowResUrl,
      animatedUrl: nft.video_url ?? nft.audio_url ?? nft.model_url ?? nft.extra_metadata?.animation_original_url ?? undefined,
      animatedMimeType: nft.video_properties?.mime_type ?? nft.audio_properties?.mime_type ?? nft.image_properties?.mime_type ?? undefined,
      mimeType: nft.image_properties?.mime_type,
    },
    uniqueId: `${nft.chain}_${nft.contract_address}_${nft.token_id}`.toLowerCase() as `${Network}_${Address}_${number}`,
    tokenId: nft.token_id,
    name: nft.name,
    chainId: chainsIdByName[nft.chain],
    contractAddress: lowercasedContractAddress as Address,
    network: nft.chain as Network,
    isSendable: !isPoap && (nft.contract?.type === NftTokenType.Erc721 || nft.contract?.type === NftTokenType.Erc1155),
    acquiredAt: nft.owners?.find(o => o.owner_address === address)?.last_acquired_date ?? undefined,
    backgroundColor: nft.background_color || nft.previews?.predominant_color,
    description: nft.description,
    collectionName: collection.name,
    collectionImageUrl: collection.image_url,
    collectionDescription: collection.description,
    collectionUrl: collection.external_url,
    traits: nft.extra_metadata?.attributes?.map(attr => ({ value: attr.value ?? '', trait_type: attr.trait_type ?? '' })) ?? [],
    discordUrl: collection.discord_url,
    twitterUrl: collection.twitter_username ? `https://x.com/${collection.twitter_username}` : undefined,
    websiteUrl: collection.external_url,
    floorPrice:
      floorPrice?.value !== null && floorPrice?.value !== undefined
        ? convertRawAmountToRoundedDecimal(
            floorPrice?.value,
            floorPrice?.payment_token?.decimals ?? undefined,
            // TODO: switch to 3 once OS is gone, doing this to match OS
            4
          )
        : undefined,
    marketplaceName: marketplace?.collection_url ? marketplace.marketplace_name : undefined,
    marketplaceUrl: marketplace?.collection_url,
  };
}
