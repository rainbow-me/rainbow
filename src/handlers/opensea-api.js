import { captureException } from '@sentry/react-native';
import { OPENSEA_API_KEY, OPENSEA_RINKEBY_API_KEY } from 'react-native-dotenv';
import { rainbowFetch } from '../rainbow-fetch';
import NetworkTypes from '@rainbow-me/networkTypes';
import { parseAccountUniqueTokens } from '@rainbow-me/parsers';
import { handleSignificantDecimals } from '@rainbow-me/utilities';
import {
  ENS_NFT_CONTRACT_ADDRESS,
  REVERSE_RECORDS_MAINNET_ADDRESS,
  reverseRecordsABI,
} from '@rainbow-me/references';
import { Contract } from '@ethersproject/contracts';
import { web3Provider } from './web3';
import { abbreviations } from '@rainbow-me/utils';
import { formatAssetForDisplay } from '@rainbow-me/helpers';
import logger from 'logger';
import { EventTypes, PaymentTokens } from '@rainbow-me/utils/tokenHistoryUtils';

const reverseRecordContract = new Contract(
  REVERSE_RECORDS_MAINNET_ADDRESS,
  reverseRecordsABI,
  web3Provider
);

const emptyAddress = "0x0000000000000000000000000000000000000000";

export const UNIQUE_TOKENS_LIMIT_PER_PAGE = 50;
export const UNIQUE_TOKENS_LIMIT_TOTAL = 2000;

export const apiGetAccountUniqueTokens = async (network, address, page) => {
  try {
    const API_KEY =
      network === NetworkTypes.rinkeby
        ? OPENSEA_RINKEBY_API_KEY
        : OPENSEA_API_KEY;
    const networkPrefix = network === NetworkTypes.mainnet ? '' : `${network}-`;
    const offset = page * UNIQUE_TOKENS_LIMIT_PER_PAGE;
    const url = `https://${networkPrefix}api.opensea.io/api/v1/assets`;
    const data = await rainbowFetch(url, {
      headers: {
        'Accept': 'application/json',
        'X-Api-Key': API_KEY,
      },
      method: 'get',
      params: {
        limit: UNIQUE_TOKENS_LIMIT_PER_PAGE,
        offset: offset,
        owner: address,
      },
      timeout: 20000, // 20 secs
    });
    return parseAccountUniqueTokens(data);
  } catch (error) {
    logger.sentry('Error getting unique tokens', error);
    captureException(new Error('Opensea: Error getting unique tokens'));
    throw error;
  }
};

export const apiGetUniqueTokenFloorPrice = async (
  network,
  urlSuffixForAsset
) => {
  try {
    const networkPrefix = network === NetworkTypes.mainnet ? '' : `${network}-`;
    const url = `https://${networkPrefix}api.opensea.io/api/v1/asset/${urlSuffixForAsset}`;
    const data = await rainbowFetch(url, {
      headers: {
        Accept: 'application/json',
        method: 'get',
        timeout: 5000, // 5 secs
      },
    });

    const slug = data?.data?.collection?.slug;

    const collectionURL = `https://${networkPrefix}api.opensea.io/api/v1/collection/${slug}`;
    const collectionData = await rainbowFetch(collectionURL, {
      headers: {
        'Accept': 'application/json',
        'X-Api-Key': OPENSEA_API_KEY,
      },
      method: 'get',
      timeout: 5000, // 5 secs
    });

    const tempPrice = collectionData?.data?.collection?.stats?.floor_price;

    if (parseFloat(tempPrice) === 0 || !tempPrice) {
      return 'None';
    }

    const tempFloorPrice = handleSignificantDecimals(tempPrice, 5);

    return parseFloat(tempFloorPrice) + ' ETH';
  } catch (error) {
    logger.sentry('Error getting NFT floor price', error);
    captureException(new Error('Opensea: Error getting NFT floor price'));
    throw error;
  }
};

export const apiGetNftSemiFungibility = async (
  networkPrefix,
  contractAddress,
  tokenID
) => {
  const checkFungibility = `https://${networkPrefix}api.opensea.io/api/v1/events?asset_contract_address=${contractAddress}&token_id=${tokenID}&only_opensea=false&offset=0&limit=1`;

  const fungData = await rainbowFetch(checkFungibility, {
    headers: {
      'Accept': 'application/json',
      'X-Api-Key': OPENSEA_API_KEY,
    },
    method: 'get',
    timeout: 10000, // 10 secs
  });

  const semiFungible =
    fungData?.data?.asset_events[0]?.asset?.asset_contract
      ?.asset_contract_type === 'semi-fungible';
  return semiFungible;
};

export const apiGetNftTransactionHistory = async (
  networkPrefix,
  semiFungible,
  accountAddress,
  contractAddress,
  tokenID
) => {
  let offset = 0;
  let array = [];
  let nextPage = true;
  while (nextPage) {
    const urlPage = semiFungible
      ? `https://${networkPrefix}api.opensea.io/api/v1/events?account_address=${accountAddress}&asset_contract_address=${contractAddress}&token_id=${tokenID}&only_opensea=false&offset=${offset}&limit=300`
      : `https://${networkPrefix}api.opensea.io/api/v1/events?asset_contract_address=${contractAddress}&token_id=${tokenID}&only_opensea=false&offset=${offset}&limit=300`;
    let currentPage = await rainbowFetch(urlPage, {
      headers: {
        'Accept': 'application/json',
        'X-Api-Key': OPENSEA_API_KEY,
      },
      method: 'get',
      timeout: 10000, // 10 secs
    });
    array = array.concat(currentPage?.data?.asset_events || []);
    offset = array.length + 1;
    nextPage = currentPage?.data?.asset_events?.length === 300;
  }
  return array.filter(
    ({ event_type }) =>
      event_type === EventTypes.TRANSFER.type ||
      event_type === EventTypes.SALE.type
  );
};

export const processRawEvents = async (contractAddress, rawEvents) => {
  let addressArray = new Array();
  const events = await rawEvents
    .map(function (event) {
      let eventType = event.event_type;
      let createdDate = event.created_date;
      let toAccountEthAddress = event.to_account?.address;
      let saleAmount, paymentToken, toAccount;

      switch (eventType) {
        case EventTypes.TRANSFER.type:
          if (event.from_account?.address === emptyAddress) {
            eventType = contractAddress === ENS_NFT_CONTRACT_ADDRESS ? EventTypes.ENS.type : EventTypes.MINT.type;
          }
          break;

        case EventTypes.SALE.type:
          paymentToken =
            event.payment_token?.symbol === PaymentTokens.WETH
              ? PaymentTokens.ETH
              : event.payment_token?.symbol;
              
          const exactSaleAmount = formatAssetForDisplay({
            amount: parseInt(event.total_price).toString(),
            token: paymentToken,
          });

          saleAmount = handleSignificantDecimals(exactSaleAmount, 5);
          break;
      }

      if (toAccountEthAddress) {
        addressArray.push(toAccountEthAddress);
      }

      return {
        createdDate,
        eventType,
        paymentToken,
        saleAmount,
        toAccountEthAddress,
        toAccount
      };
    });

  let ensArray = await reverseRecordContract.getNames(addressArray);

  const ensMap = ensArray.reduce(function(tempMap, ens, index) {
    tempMap[addressArray[index]] = ens;
    return tempMap;
  }, {});

  events.map((event) => {
    const address = event.toAccountEthAddress;
    if (address) {
      const ens = ensMap[address];
      event.toAccount = ens
        ? abbreviations.formatAddressForDisplay(ens)
        : abbreviations.address(address, 2);
    }
  });

  events.sort((event1, event2) => event2.createdDate.localeCompare(event1.createdDate));
  
  return events;
};
