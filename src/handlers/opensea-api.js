import { OPENSEA_API_KEY } from 'react-native-dotenv';
import { rainbowFetch } from '../rainbow-fetch';
import NetworkTypes from '@rainbow-me/networkTypes';
import { parseAccountUniqueTokens } from '@rainbow-me/parsers';
import logger from 'logger';
import { UNISWAP_PAIRS_HISTORICAL_BULK_QUERY } from 'src/apollo/queries';

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

//This is currently O(n) time complexity, is there a way to improve performance?
export const apiGetTokenHistory = async (
  contractAddress,
  tokenID
) => {
  try {
    const url = `https://api.opensea.io/api/v1/events?asset_contract_address=${contractAddress}&token_id=${tokenID}&only_opensea=false&offset=0&limit=299`;
    logger.log(url);
    const data = await rainbowFetch(url, {
      headers: {
        'Accept': 'application/json',
        'X-Api-Key': OPENSEA_API_KEY,
      },
      method: 'get',
      timeout: 10000, // 10 secs
    })

    const array = data.data.asset_events;

    const result = 
      await array.filter(function(event) {
        //TODO: If events are maxed out and there are no mappable events, run the next X amount
        //TODO: Error handling?
        var event_type = event.event_type;
        logger.log("filtered event: " + event_type);
        if (event_type == "created" || event_type == "transfer" || event_type == "successful" || event_type == "cancelled") {
          return true;
        }
        return false;
        
      })
      .map(function(event) {
        //TODO: Based on event, craft event object with different fields
        var event_type = event.event_type;
        var created_date = event.created_date;
        logger.log("mapped event: " + event.event_type);
        logger.log("mapped date: " + created_date);

        const eventObject = {
          event_type,
          created_date,
        };

        return eventObject;
        
      })

      return result;
    
  } catch (error) {
    logger.log(error);
    throw error;
  }
};

/**
 * Fetch a tokens entire history
 * 
 */
  function apiGetAllEventsForToken (
  contractAddress, 
  tokenID) {

  const url = `https://api.opensea.io/api/v1/events?asset_contract_address=${contractAddress}&token_id=${tokenID}&only_opensea=false&offset=0&limit=299`;
    logger.log(url);
    const data = await rainbowFetch(url, {
      headers: {
        'Accept': 'application/json',
        'X-Api-Key': OPENSEA_API_KEY,
      },
      method: 'get',
      timeout: 10000, // 10 secs
    })

    var array = data.data.asset_events;
    var offset = 0;
    var tempResponse = array;

    while (tempResponse.length != 0) {
      offset = array.length;
      const urlPage = `https://api.opensea.io/api/v1/events?asset_contract_address=${contractAddress}&token_id=${tokenID}&only_opensea=false&offset=${offset}&limit=299`;
      // logger.log(url);
      const nextPage = await rainbowFetch(urlPage, {
        headers: {
          'Accept': 'application/json',
          'X-Api-Key': OPENSEA_API_KEY,
        },
        method: 'get',
        timeout: 10000, // 10 secs
      })

      tempResponse = nextPage.data.asset_events;
      array.concat(tempResponse);
    }

    return array;
}
