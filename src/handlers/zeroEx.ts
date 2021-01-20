import axios, { AxiosResponse } from 'axios';
import { ZeroExPayload, ZeroExQuote } from '@rainbow-me/entities';
import NetworkTypes from '@rainbow-me/networkTypes';
import { RAINBOW_ADDRESS } from '@rainbow-me/references';
import logger from 'logger';

const api = axios.create({
  headers: {
    Accept: 'application/json',
  },
  timeout: 20000, // 20 secs
});

const buyTokenPercentageFee = '1';

const parseQuote = (
  response: AxiosResponse<ZeroExQuote>
): ZeroExPayload | null => {
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
    const networkPrefix = network === NetworkTypes.mainnet ? '' : `${network}.`;
    const params = {
      affiliateAddress: RAINBOW_ADDRESS,
      buyToken,
      buyTokenPercentageFee,
      feeRecipient: RAINBOW_ADDRESS,
      sellAmount,
      sellToken,
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
