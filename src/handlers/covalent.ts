import { captureException } from '@sentry/react-native';
import {
  // @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
  COVALENT_ANDROID_API_KEY,
  // @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
  COVALENT_IOS_API_KEY,
} from 'react-native-dotenv';
import { rainbowFetch } from '../rainbow-fetch';
import { EthereumAddress } from '@/entities';
import Logger from 'logger';

// A response from Covalent for the address balance API.
// See https://www.covalenthq.com/docs/api/#/0/Get%20historical%20portfolio%20value%20over%20time/USD/1.
interface CovalentAddressBalanceResponseData {
  address: string;
  updated_at: string;
  next_update_at: string;
  quote_currency: string;
  items: {
    contract_decimals: number;
    contract_name: string;
    contract_ticker_symbol: string;
    contract_address: string;
    supports_erc: string[] | null;
    logo_url: string;
    last_transferred_at: string | null;
    type: string;
    balance: string;
    balance_24h: string;
    quote_rate: number;
    quote_rate_24h: number;
    quote: number;
    quote_24h: number;
    nft_data: any[] | null;
  }[];
}

export const getAssetsFromCovalent = async (
  chainId: number,
  accountAddress: EthereumAddress,
  currency: string
): Promise<CovalentAddressBalanceResponseData | null> => {
  try {
    const url = `https://api.covalenthq.com/v1/${chainId}/address/${accountAddress}/balances_v2/`;

    const params = {
      'key': ios ? COVALENT_IOS_API_KEY : COVALENT_ANDROID_API_KEY,
      'nft': 'false',
      'quote-currency': currency,
    };

    const response = await rainbowFetch(url, {
      method: 'get',
      params,
      timeout: 10000, // 10 secs
    });

    if (response?.data?.data && !response?.data.error) {
      return response.data.data;
    }
  } catch (e) {
    Logger.sentry('error fetching assets from covalent for chainId:', chainId);
    Logger.sentry('Error:', e);
    captureException(new Error('Covalent assets exception'));
  }
  return null;
};
