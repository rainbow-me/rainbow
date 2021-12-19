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

export const apiGetTokenHistory = async (
  network,
  contractAddress,
  tokenID,
  accountAddress
) => {
  try {
    const networkPrefix = network === NetworkTypes.mainnet ? '' : `${network}-`;
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
    console.log("zooty");
    const allEvents = await fetchAllTokenHistoryEvents({
      accountAddress,
      contractAddress,
      networkPrefix,
      semiFungible,
      tokenID,
    });
    console.log("jimbo");
    const result = await filterAndMapData(contractAddress, allEvents);
    console.log("gumby");
    return result;
  } catch (error) {
    logger.debug('TOKEN HISTORY LOOP ERROR:', error);
    throw error;
  }
};

const fetchAllTokenHistoryEvents = async ({
  networkPrefix,
  semiFungible,
  accountAddress,
  contractAddress,
  tokenID,
}) => {
  let offset = 0;
  let array = [];
  let nextPage = true;
  while (nextPage) {
    console.log(nextPage);
    const urlPage = semiFungible
      ? `https://${networkPrefix}api.opensea.io/api/v1/events?account_address=${accountAddress}&asset_contract_address=${contractAddress}&token_id=${tokenID}&only_opensea=false&offset=${offset}&limit=300`
      : `https://${networkPrefix}api.opensea.io/api/v1/events?asset_contract_address=${contractAddress}&token_id=${tokenID}&only_opensea=false&offset=${offset}&limit=300`;
    console.log("zorble");
    console.log(urlPage);
    let currentPage = await rainbowFetch(urlPage, {
      headers: {
        'Accept': 'application/json',
        'X-Api-Key': OPENSEA_API_KEY,
      },
      method: 'get',
      timeout: 10000, // 10 secs
    });
    console.log("yup");
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

const filterAndMapData = async (contractAddress, array) => {
  let addressArray = new Array();
  const events = await array
    .map(function (uniqueEvent) {
      let event_type = uniqueEvent.event_type;
      let created_date = uniqueEvent.created_date;
      let to_account_eth_address = uniqueEvent.to_account?.address;
      let sale_amount, payment_token, to_account;
      console.log("zap");
      console.log(ENS_NFT_CONTRACT_ADDRESS);
      switch (event_type) {
        case EventTypes.TRANSFER.type:
          if (uniqueEvent.from_account?.address === emptyAddress) {
            event_type = contractAddress === ENS_NFT_CONTRACT_ADDRESS ? EventTypes.ENS.type : EventTypes.MINT.type;
          }
          break;

        case EventTypes.SALE.type:
          console.log("hiiiiiiiii");
          console.log(PaymentTokens);
          console.log(PaymentTokens.WETH);
          console.log(EventTypes);
          payment_token =
            uniqueEvent.payment_token?.symbol === PaymentTokens.WETH
              ? PaymentTokens.ETH
              : uniqueEvent.payment_token?.symbol;

          // eslint-disable-next-line no-case-declarations
          const zz = uniqueEvent.total_price.split('.');
          // eslint-disable-next-line no-case-declarations
          const temp_sale_amount = formatAssetForDisplay({
            amount: zz[0],
            token: payment_token,
          });

          sale_amount = handleSignificantDecimals(temp_sale_amount, 5);
          console.log("zoot");
          console.log(sale_amount);
          break;
      }

      if (to_account_eth_address) {
        addressArray.push(to_account_eth_address);
      }
      return {
        created_date,
        event_type,
        payment_token,
        sale_amount,
        to_account,
        to_account_eth_address
      };
    });
  console.log("xyz");
  console.log(addressArray);
  let allNames = await reverseRecordContract.getNames(addressArray);
  let index = 0;
  console.log("okok");
  console.log(allNames);
  events.map((uniqueEvent) => {
    if (uniqueEvent.to_account_eth_address) {
      if (allNames[index] !== '') {
        const abbrevENS = abbreviations.formatAddressForDisplay(allNames[index]);
        console.log("a");
        console.log(allNames[index]);
        console.log(abbrevENS);
        uniqueEvent.to_account = abbrevENS;
        index += 1;
      }
      else {
        const abbrevAddress = abbreviations.address(uniqueEvent.to_account, 2);
        console.log("b");
        console.log(abbrevAddress);
        uniqueEvent.to_account = abbrevAddress;
      }
    }
  });
  console.log("brookie");

  return events;
};
