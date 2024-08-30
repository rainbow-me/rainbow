import { UniqueAsset } from '@/entities';
import { gretch } from 'gretchen';
import { paths } from '@reservoir0x/reservoir-sdk';
import { RainbowError, logger } from '@/logger';
import { handleSignificantDecimals } from '@/helpers/utilities';
import { Network } from '@/helpers';
import { IS_PROD } from '@/env';
import { RESERVOIR_API_KEY_DEV, RESERVOIR_API_KEY_PROD } from 'react-native-dotenv';

const SUPPORTED_NETWORKS = [Network.mainnet, Network.polygon, Network.bsc, Network.arbitrum, Network.optimism, Network.base, Network.zora];

type ErrorResponse = {
  errors: {
    message: string;
  }[];
};

type SuccessResponse = paths['/collections/v6']['get']['responses']['200']['schema'];

export async function fetchReservoirNFTFloorPrice(nft: UniqueAsset): Promise<string | undefined> {
  if (SUPPORTED_NETWORKS.includes(nft.network)) {
    try {
      const res = await gretch<SuccessResponse, ErrorResponse>(
        `https://api${nft.network === Network.mainnet ? '' : `-${nft.network}`}.reservoir.tools/collections/v6?contract=${
          nft.asset_contract.address
        }`,
        {
          method: 'GET',
          headers: {
            'x-api-key': IS_PROD ? RESERVOIR_API_KEY_PROD : RESERVOIR_API_KEY_DEV,
          },
        }
      ).json();
      if (res?.data?.collections?.[0]?.floorAsk?.price?.amount?.decimal && res?.data?.collections?.[0]?.floorAsk?.price?.currency?.symbol) {
        const roundedDecimal = handleSignificantDecimals(
          res?.data?.collections?.[0]?.floorAsk?.price?.amount?.decimal,
          18,
          3,
          undefined,
          false
        );
        return `${roundedDecimal} ${res?.data?.collections?.[0]?.floorAsk?.price?.currency?.symbol}`;
      }
    } catch (e) {
      logger.error(new RainbowError(`Error fetching NFT floor price from Reservoir: ${e}`));
    }
  }
  return undefined;
}
