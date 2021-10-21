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


// console.log(result); // eslint-disable-line no-console
// export const apiGetTokenHistory = async (
//   contractAddress,
//   tokenID
// ) => {
//   try {
//     const url = `https://api.opensea.io/api/v1/events?asset_contract_address=${contractAddress}&token_id=${tokenID}&only_opensea=false&offset=0`;
//     logger.log(url); // eslint-disable-line no-console
//     const data = await rainbowFetch(url, {
//       headers: {
//         'Accept': 'application/json',
//         'X-Api-Key': OPENSEA_API_KEY,
//       },
//       method: 'get',
//       timeout: 25000, // 5 secs
//     })

//     var result;

//     data.data.asset_events.forEach(function(asset_event) {

//       var event = asset_event.event_type;
//       var created_date = JSON.stringify(asset_event.created_date);
//       var from_address = JSON.stringify(asset_event.from_account.address);
//       // var owner_address = JSON.stringify(asset_event.to_account.address);
//       // var total_price = JSON.stringify(asset_event.total_price);

    
//       if (event == '"created"' || event == '"successful"' || event == '"cancelled"'|| event == '"transfer"') {
//         const eventObject = {
//           event,
//           created_date,
//           from_address,
//         };
//         result.push(eventObject);
//         logger.log(eventObject.event);
//       }
//     })

//     logger.log("hi mike");
//     return result;

//   } catch (error) {
//     throw error;
//   }
// };

export const apiGetTokenHistory = async (
  contractAddress,
  tokenID
) => {
  try {
    const url = `https://api.opensea.io/api/v1/events?asset_contract_address=${contractAddress}&token_id=${tokenID}&only_opensea=false&offset=0&limit=100`;
    logger.log(url);
    const data = await rainbowFetch(url, {
      headers: {
        'Accept': 'application/json',
        'X-Api-Key': OPENSEA_API_KEY,
      },
      method: 'get',
      timeout: 15000, // 15 secs. Way too long but lets try it
    })

    const array = data.data.asset_events;
    // logger.log(JSON.stringify(data.data.asset_events[0].from_account.address));
    return ( 
      array.filter(function(event) {
        var event_type = event.event_type;
        logger.log("filtered event: " + event_type);
        if (event_type == "created" || event_type == "transfer" || event_type == "successful" || event_type == "cancelled") {
          return true;
        }
        return false;
      })
      .map(function(event) {
        var event_type = event.event_type;
        var created_date = event.created_date;
        var from_address = event.from_account.address;
        logger.log("mapped event: " + event.event_type);
        logger.log("mapped date: " + created_date);
        logger.log("mapped from: " + from_address);

        const eventObject = {
          event_type,
          created_date,
          from_address,
        };

        return eventObject;
        
      })
    )
  } catch (error) {
    throw error;
  }
};
