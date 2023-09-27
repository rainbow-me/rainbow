import { Block, StaticJsonRpcProvider } from '@ethersproject/providers';
import {
  estimateGasWithPadding,
  getProviderForNetwork,
  toHexNoLeadingZeros,
} from './web3';
import config from '@/model/config';
import { MaxUint256 } from '@ethersproject/constants';
import { RainbowError, logger } from '@/logger';
import { Network } from '@/helpers';
import { getClosestGasEstimate } from './swap';
import { ethUnits } from '@/references';
import { NftOffer } from '@/graphql/__generated__/arc';

type TxData = {
  to: string;
  from: string;
  data: string;
};

const getStateDiff = async (
  provider: StaticJsonRpcProvider,
  approval: TxData
): Promise<any> => {
  const {
    number: blockNumber,
  } = await (provider.getBlock as () => Promise<Block>)();

  // trace_call default params
  const callParams = [
    {
      data: approval.data,
      from: approval.from,
      to: approval.to,
    },
    ['stateDiff'],
    toHexNoLeadingZeros(
      blockNumber - Number(config.trace_call_block_number_offset || 20)
    ),
  ];

  const trace = await provider.send('trace_call', callParams);

  if (trace.stateDiff) {
    const slotAddress = Object.keys(trace.stateDiff[approval.to]?.storage)?.[0];
    if (slotAddress) {
      const formattedStateDiff = {
        [approval.to]: {
          stateDiff: {
            [slotAddress]: MaxUint256.toHexString(),
          },
        },
      };
      return formattedStateDiff;
    }
  }
  logger.warn('Failed to get stateDiff for NFT Offer', {
    trace: JSON.stringify(trace, null, 2),
  });
};

export const estimateNFTOfferGas = async (
  offer: NftOffer,
  approval: TxData | undefined,
  sale: TxData | undefined
): Promise<string | null> => {
  // rough gas estimate
  const fallbackGas =
    offer.network === Network.mainnet
      ? ethUnits.mainnet_nft_offer_gas_fee_fallback.toString()
      : ethUnits.l2_nft_offer_gas_fee_fallback.toString();
  const provider = await getProviderForNetwork(offer.network);
  if (!sale) {
    if (offer.marketplace.name !== 'Blur') {
      // expecting sale tx data for all marketplaces except Blur
      logger.warn('No sale tx data for NFT Offer');
    }
    return fallbackGas;
  }
  if (!approval) {
    return await estimateGasWithPadding(sale, null, null, provider);
  }
  if (offer.network !== Network.mainnet) {
    return fallbackGas;
  }
  try {
    const stateDiff = await getStateDiff(provider, approval);

    const gasLimit = await getClosestGasEstimate(async (gas: number) => {
      const callParams = [
        {
          data: sale.data,
          from: sale.from,
          gas: toHexNoLeadingZeros(gas),
          gasPrice: toHexNoLeadingZeros(`100000000000`),
          to: sale.to,
        },
        'latest',
      ];

      try {
        await provider.send('eth_call', [...callParams, stateDiff]);
        logger.info(`Estimate worked with gasLimit: ${gas}`);
        return true;
      } catch (e) {
        logger.info(
          `Estimate failed with gasLimit: ${gas}. Trying with different amounts...`
        );
        return false;
      }
    });

    if (gasLimit && gasLimit >= ethUnits.basic_swap) {
      return gasLimit.toString();
    } else {
      logger.error(
        new RainbowError('Could not find a gas estimate for NFT Offer')
      );
    }
  } catch (e) {
    logger.error(
      new RainbowError(
        `Blew up trying to get state diff for NFT Offer.\nerror: ${e}`
      )
    );
  }
  return fallbackGas;
};
