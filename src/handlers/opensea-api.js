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
import { FormatAssetForDisplay } from '@rainbow-me/helpers';
import logger from 'logger';

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
    logger.log('Error getting unique tokens', error);
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
    logger.debug('FLOOR PRICE ERROR', error);
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
    const urlPage = semiFungible
      ? `https://${networkPrefix}api.opensea.io/api/v1/events?account_address=${accountAddress}&asset_contract_address=${contractAddress}&token_id=${tokenID}&only_opensea=false&offset=${offset}&limit=299`
      : `https://${networkPrefix}api.opensea.io/api/v1/events?asset_contract_address=${contractAddress}&token_id=${tokenID}&only_opensea=false&offset=${offset}&limit=299`;

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
    nextPage = currentPage?.data?.asset_events?.length === 299;
  }
  return array;
};

//Need to figure out how to do this without querying ethers 1000 times
// Follow up with Bruno
async function getAddresses(addressArray) {
  try {
    // logger.debug('REVERSE ADDRESS: ', REVERSE_RECORDS_MAINNET_ADDRESS);
    // logger.debug('ABI: ', reverseRecordsABI);
    console.log("zoopy");
    console.log(REVERSE_RECORDS_MAINNET_ADDRESS);
    console.log("a");
    console.log(reverseRecordsABI);
    console.log("b");
    console.log(web3Provider);
    console.log("zoink");
    const reverseRecordContract = new Contract(
      REVERSE_RECORDS_MAINNET_ADDRESS,
      reverseRecordsABI,
      web3Provider
    );
    console.log("benten");
    const result = await reverseRecordContract.getNames(addressArray);
    console.log("chickens");
    return result;
  }
  catch(error) {
    logger.debug('CONTRACT ERROR:', error);
  }
  
}

const filterAndMapData = async (contractAddress, array) => {
  let addressArray = new Array();
  const events = await array
    .filter(
      ({ event_type }) =>
        event_type === 'created' ||
        event_type === 'transfer' ||
        event_type === 'successful' ||
        event_type === 'cancelled'
    )
    .map(function (uniqueEvent) {
      let event_type = uniqueEvent.event_type;
      let created_date = uniqueEvent.created_date;
      let from_account = '0x123';
      let to_account = '0x123';
      let sale_amount = '0';
      let list_amount = '0';
      let payment_token = 'x';
      let to_account_eth_address = '0x0000000000000000000000000000000000000000';
      let event_object;
      console.log("zap");
      console.log(ENS_NFT_CONTRACT_ADDRESS);
      switch (event_type) {
        case 'transfer': {
          const address = uniqueEvent.to_account?.address || '????';
          let from_acc = uniqueEvent.from_account?.address;
          if (
            contractAddress === ENS_NFT_CONTRACT_ADDRESS &&
            from_acc === '0x0000000000000000000000000000000000000000'
          ) {
            event_type = 'ens-registration';
            to_account_eth_address = uniqueEvent.to_account.address;
            to_account = address;
          } else if (
            contractAddress !== ENS_NFT_CONTRACT_ADDRESS &&
            from_acc === '0x0000000000000000000000000000000000000000'
          ) {
            event_type = 'mint';
            to_account_eth_address = uniqueEvent.to_account.address;
            to_account = address;
          } else {
            to_account_eth_address = uniqueEvent.to_account.address;
            to_account = address;
          }
          break;
        }
        case 'successful':
          payment_token =
            uniqueEvent.payment_token?.symbol === 'WETH'
              ? 'ETH'
              : uniqueEvent.payment_token?.symbol;

          // eslint-disable-next-line no-case-declarations
          const zz = uniqueEvent.total_price.split('.');
          // eslint-disable-next-line no-case-declarations
          const temp_sale_amount = FormatAssetForDisplay({
            amount: zz[0],
            token: payment_token,
          });

          sale_amount = handleSignificantDecimals(temp_sale_amount, 5);
          break;

        case 'created':
          payment_token =
            uniqueEvent.payment_token?.symbol === 'WETH'
              ? 'ETH'
              : uniqueEvent.payment_token?.symbol;
          // eslint-disable-next-line no-case-declarations
          const yy = uniqueEvent.starting_price.split('.');
          // eslint-disable-next-line no-case-declarations
          const temp_list_amount = FormatAssetForDisplay({
            amount: yy[0],
            token: payment_token,
          });
          list_amount = handleSignificantDecimals(temp_list_amount, 5);

          break;

        default:
        case 'cancelled':
          break;
      }
      event_object = {
        created_date,
        event_type,
        from_account,
        list_amount,
        payment_token,
        sale_amount,
        to_account,
        to_account_eth_address,
      };

      addressArray.push(to_account_eth_address);
      return event_object;
    });
  console.log("xyz");
  console.log(addressArray);
  const allNames = await getAddresses(addressArray);
  console.log("okok");
  console.log(allNames);
  await events.map(function(uniqueEvent, index) {
    if (allNames[index] != '') {
      const abbrevENS = abbreviations.formatAddressForDisplay(allNames[index]);
      uniqueEvent.to_account = abbrevENS;
    }
    else {
      const abbrevAddress = abbreviations.address(uniqueEvent.to_account, 2);
      uniqueEvent.to_account = abbrevAddress;
    }
  });
  console.log("brookie");

  return events;
};
