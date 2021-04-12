import axios, { AxiosResponse } from 'axios';
import { ZeroExPayload, ZeroExQuote } from '@rainbow-me/entities';
import { toHex } from '@rainbow-me/handlers/web3';
import NetworkTypes from '@rainbow-me/networkTypes';
import { RAINBOW_ADDRESS, ZERO_ADDRESS } from '@rainbow-me/references';
import logger from 'logger';

const api = axios.create({
  headers: {
    Accept: 'application/json',
  },
  timeout: 20000, // 20 secs
});

const buyTokenPercentageFee = '1';
const slippagePercentage = '1';

const parseQuote = (
  response: AxiosResponse<ZeroExQuote>
): ZeroExPayload | null => {
  logger.log('Requested 0x url', response?.request?.responseURL);
  if (!response?.data) return null;
  const result: ZeroExQuote = response.data;
  return {
    allowanceTarget: result.allowanceTarget,
    swapPayload: result.data,
    swapTarget: result.to,
  };
};

export const getQuote = async (
  network: string,
  sellToken: string,
  buyToken: string,
  sellAmount: string
): Promise<ZeroExPayload | null> => {
  try {
    if (sellToken === buyToken) {
      return {
        allowanceTarget: ZERO_ADDRESS,
        swapPayload: toHex(0),
        swapTarget: ZERO_ADDRESS,
      };
    }

    const networkPrefix = network === NetworkTypes.mainnet ? '' : `${network}.`;
    const params = {
      affiliateAddress: RAINBOW_ADDRESS,
      buyToken,
      buyTokenPercentageFee,
      feeRecipient: RAINBOW_ADDRESS,
      sellAmount,
      sellToken,
      slippagePercentage,
    };
    const url = `https://${networkPrefix}api.0x.org/swap/v1/quote`;
    const response = await api.get(url, {
      params,
    });
    return parseQuote(response);
  } catch (error) {
    logger.log('Error getting zeroEx quote', error);
  }
  return null;
};
