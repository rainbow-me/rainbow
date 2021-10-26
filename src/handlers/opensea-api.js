import { OPENSEA_API_KEY } from 'react-native-dotenv';
import { rainbowFetch } from '../rainbow-fetch';
import NetworkTypes from '@rainbow-me/networkTypes';
import { parseAccountUniqueTokens } from '@rainbow-me/parsers';
import logger from 'logger';
import { abbreviations } from '../utils';
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

    var array = data.data.asset_events;
    
    var tempResponse = array;

    if (array.length == 299) {
      var offset = 299;
      while (tempResponse.length != 0) {
        var urlPage = `https://api.opensea.io/api/v1/events?asset_contract_address=${contractAddress}&token_id=${tokenID}&only_opensea=false&offset=${offset}&limit=299`;
        var nextPage = await rainbowFetch(urlPage, {
          headers: {
            'Accept': 'application/json',
            'X-Api-Key': OPENSEA_API_KEY,
          },
          method: 'get',
          timeout: 10000, // 10 secs
        })
  
        tempResponse = nextPage.data.asset_events;
        array = array.concat(tempResponse);
        offset = array.length + 1;
      }
    }
    
    //Not every event type has all the fields, so based on the type of event, we need to parse the respective fields
    const result =  array.filter(function(event) {
      var event_type = event.event_type;
      if (event_type == "created" || event_type == "transfer" || event_type == "successful" || event_type == "cancelled") {
        return true;
      }
      return false;
      
    })
    .map(function(event) {
      var event_type = event.event_type;
      var eventObject;

      if (event_type == "created") {
        var created_date = event.created_date;
        var from_account = "0x123";
        var to_account = "0x123";
        var sale_amount = "0";
        var tempList = parseInt(event.starting_price / 1000000000000000000);
        var list_amount = tempList.toString();

        eventObject = {
          event_type,
          created_date,
          from_account,
          to_account,
          sale_amount,
          list_amount
        };
      }
      else if (event_type == "transfer") {
        var created_date = event.created_date;
        var fro_acc = event.from_account.address;
        var to_account = abbreviations.address(event.to_account.address);
        var sale_amount = "0";
        var list_amount = "0";

        if (fro_acc == "0x0000000000000000000000000000000000000000") {
          eventObject = {
            event_type: 'mint',
            created_date,
            from_account: "0x123",
            to_account,
            sale_amount,
            list_amount
          };
        }
        else {
          eventObject = {
            event_type,
            created_date,
            from_account,
            to_account,
            sale_amount,
            list_amount
          };
        }
      }
      else if (event_type == "successful") {
        var created_date = event.created_date;
        var from_account = "0x123";
        var to_account = "0x123";
        var tempSale = parseInt(event.total_price / 1000000000000000000);
        var sale_amount = tempSale.toString();
        var list_amount = "0";

        eventObject = {
          event_type,
          created_date,
          from_account,
          to_account,
          sale_amount,
          list_amount
        };
      }
      else if (event_type == "cancelled") {
        var created_date = event.created_date;
        var from_account = "0x123";
        var to_account = "0x123";
        var sale_amount = "0";
        var list_amount = "0";

        eventObject = {
          event_type,
          created_date,
          from_account,
          to_account,
          sale_amount,
          list_amount
        };
      }
      
      return eventObject;
    })

    return result;
    
  } catch (error) {
    logger.log(error);
    throw error;
  }
};
