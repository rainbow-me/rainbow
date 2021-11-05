import { isHexString } from '@ethersproject/bytes';
import { OPENSEA_API_KEY } from 'react-native-dotenv';
import { rainbowFetch } from '../rainbow-fetch';
import { ENS_NFT_CONTRACT_ADDRESS } from '../references';
import { abbreviations } from '../utils';
import { convertAddressToENSOrAddressDisplay } from '@rainbow-me/hooks';
import NetworkTypes from '@rainbow-me/networkTypes';
import { parseAccountUniqueTokens } from '@rainbow-me/parsers';
import { fromWei, handleSignificantDecimals } from '@rainbow-me/utilities';
import logger from 'logger';

export const UNIQUE_TOKENS_LIMIT_PER_PAGE = 50;
export const UNIQUE_TOKENS_LIMIT_TOTAL = 2000;

export const apiGetAccountUniqueTokens = async (network, address, page) => {
  try {
    const networkPrefix = network === NetworkTypes.mainnet ? '' : `${network}-`;
    const offset = page * UNIQUE_TOKENS_LIMIT_PER_PAGE;
    const url = `https://${networkPrefix}api.opensea.io/api/v1/assets`;
    const data = await rainbowFetch(url, {
      headers: {
        'Accept': 'application/json',
        'X-Api-Key': OPENSEA_API_KEY,
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
    const EthSuffix = ' ETH';
    const data = await rainbowFetch(url, {
      headers: {
        'Accept': 'application/json',
        'X-Api-Key': OPENSEA_API_KEY,
      },
      method: 'get',
      timeout: 5000, // 5 secs
    });
    if (JSON.stringify(data.data.collection.stats.floor_price) === '0') {
      return 'None';
    }
    const formattedFloorPrice =
      JSON.stringify(data.data.collection.stats.floor_price) + EthSuffix;
    return formattedFloorPrice;
  } catch (error) {
    throw error;
  }
};

const fetchAllTokenHistoryEvents = async ({
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
      ? `https://api.opensea.io/api/v1/events?account_address=${accountAddress}&asset_contract_address=${contractAddress}&token_id=${tokenID}&only_opensea=false&offset=${offset}&limit=299`
      : `https://api.opensea.io/api/v1/events?asset_contract_address=${contractAddress}&token_id=${tokenID}&only_opensea=false&offset=${offset}&limit=299`;

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

export const apiGetTokenHistory = async (
  contractAddress,
  tokenID,
  accountAddress
) => {
  try {
    const checkFungibility = `https://api.opensea.io/api/v1/events?asset_contract_address=${contractAddress}&token_id=${tokenID}&only_opensea=false&offset=0&limit=1`;

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
      semiFungible,
      tokenID,
    });
    logger.debug('ALL EVENTS', allEvents.length);

    const result = await filterAndMapData(contractAddress, allEvents);
    logger.debug('results length', result.length);

    return result;
  } catch (error) {
    logger.debug('FETCH ERROR:', error);
    throw error;
  }
};

async function GetAddress(address) {
  // const addy = await convertAddressToENSOrAddressDisplay(address);

  // if (isHexString(address)) {
  //   const abbrevAddy = abbreviations.address(address, 2);
  //   return abbrevAddy;
  // }
  const abbrevAddy = await abbreviations.address(address, 2);
  return abbrevAddy;
  // const abbrevENS = abbreviations.formatAddressForDisplay(addy);

  // return abbrevENS;
}

const filterAndMapData = async (contractAddress, array) => {
  return Promise.all(
    array
      .filter(
        ({ event_type }) =>
          event_type === 'created' ||
          event_type === 'transfer' ||
          event_type === 'successful' ||
          event_type === 'cancelled'
      )
      .map(async function (uniqueEvent) {
        let event_type = uniqueEvent.event_type;
        let eventObject;
        let created_date = uniqueEvent.created_date;
        let from_account = '0x123';
        let to_account = '0x123';
        let sale_amount = '0';
        let list_amount = '0';
        let to_account_eth_address = 'x';

        switch (event_type) {

          case 'transfer': {
            // Follow up with Bruno
            // const address =
            //   (uniqueEvent.to_account?.address &&
            //     (await GetAddress(uniqueEvent.to_account.address))) ||
            //   '????';
            const address = GetAddress(uniqueEvent.to_account?.address) || '????';
            let from_acc = uniqueEvent.from_account.address;
            if (
              contractAddress === ENS_NFT_CONTRACT_ADDRESS &&
              from_acc === '0x0000000000000000000000000000000000000000'
            ) {
              eventObject = {
                created_date,
                event_type: 'ens-registration',
                from_account: '0x123',
                list_amount,
                sale_amount,
                to_account: address,
                to_account_eth_address: uniqueEvent.to_account.address,
              };
            } else if (
              contractAddress !== ENS_NFT_CONTRACT_ADDRESS &&
              from_acc === '0x0000000000000000000000000000000000000000'
            ) {
              eventObject = {
                created_date,
                event_type: 'mint',
                from_account: '0x123',
                list_amount,
                sale_amount,
                to_account: address,
                to_account_eth_address: uniqueEvent.to_account.address,
              };
            } else {
              eventObject = {
                created_date,
                event_type,
                from_account: from_acc,
                list_amount,
                sale_amount,
                to_account: address,
                to_account_eth_address: uniqueEvent.to_account.address,
              };
            }
            break;
          }
          case 'successful':
            // eslint-disable-next-line no-case-declarations
            let tempSale = fromWei(parseInt(uniqueEvent.total_price));
            sale_amount = handleSignificantDecimals(tempSale, 5);

            eventObject = {
              created_date,
              event_type,
              from_account,
              list_amount,
              sale_amount,
              to_account,
              to_account_eth_address,
            };
            break;

          case 'cancelled':
            eventObject = {
              created_date,
              event_type,
              from_account,
              list_amount,
              sale_amount,
              to_account,
              to_account_eth_address,
            };
            break;

          default:
            case 'created':
              // eslint-disable-next-line no-case-declarations
              let tempList = fromWei(parseInt(uniqueEvent.starting_price));
              list_amount = handleSignificantDecimals(tempList, 5);
  
              eventObject = {
                created_date,
                event_type,
                from_account,
                list_amount,
                sale_amount,
                to_account,
                to_account_eth_address,
              };
              break;
        }
        return eventObject;
      })
  );
};
