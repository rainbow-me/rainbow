import { OPENSEA_API_KEY } from 'react-native-dotenv';
import { rainbowFetch } from '../rainbow-fetch';
import NetworkTypes from '@rainbow-me/networkTypes';
import { parseAccountUniqueTokens } from '@rainbow-me/parsers';
import logger from 'logger';
import { fromWei, handleSignificantDecimals } from '@rainbow-me/utilities';
import { useAddressToENS } from '@rainbow-me/hooks';
import { isHexString } from '@ethersproject/bytes';
import { abbreviations } from '../utils';
import { ENS_NFT_CONTRACT_ADDRESS } from '../references';

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

export const apiGetTokenHistory = async (
  contractAddress,
  tokenID
) => {
  const getAddress = async(address) => {
    const addy = await useAddressToENS(address);

    //No ens name
    if (isHexString(addy)) {
      const abbrevAddy = abbreviations.address(addy, 2);
      return abbrevAddy;
    } 
    const abbrevENS = abbreviations.formatAddressForDisplay(addy);

    return abbrevENS;

  };

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

    let array = data.data.asset_events;
    
    let tempResponse = array;

    if (array.length == 299) {
      let offset = 299;
      while (tempResponse.length != 0) {
        let urlPage = `https://api.opensea.io/api/v1/events?asset_contract_address=${contractAddress}&token_id=${tokenID}&only_opensea=false&offset=${offset}&limit=299`;
        let nextPage = await rainbowFetch(urlPage, {
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
    return Promise.all(array.filter(function(event) {
      let event_type = event.event_type;
      if (event_type == "created" || event_type == "transfer" || event_type == "successful" || event_type == "cancelled") {
        return true;
      }
      return false;
      
    })
    .map(async function(event) {
      
      let event_type = event.event_type;
      let eventObject;
      let created_date = event.created_date;
      let from_account;
      let to_account;
      let sale_amount;
      let list_amount;
      let to_account_eth_address = "x";

      switch (event_type) {
        case "created": 
          created_date = event.created_date;
          from_account = "0x123";
          to_account = "0x123";
          sale_amount = "0";
          let tempList = fromWei(parseInt(event.starting_price));
          list_amount = handleSignificantDecimals(tempList, 5);

          eventObject = {
            event_type,
            created_date,
            from_account,
            to_account,
            sale_amount,
            list_amount,
            to_account_eth_address
          };

          break;
        case "transfer":
          await getAddress(event.to_account.address)
            .then((address) => {
              
              created_date = event.created_date;
              fro_acc = event.from_account.address;
              sale_amount = "0";
              list_amount = "0";
              if (contractAddress == ENS_NFT_CONTRACT_ADDRESS && fro_acc == "0x0000000000000000000000000000000000000000") {
                eventObject = {
                  event_type: 'ens-registration',
                  created_date,
                  from_account: "0x123",
                  to_account: address,
                  sale_amount,
                  list_amount,
                  to_account_eth_address: event.to_account.address
                };
              }
              else if (contractAddress != ENS_NFT_CONTRACT_ADDRESS && fro_acc == "0x0000000000000000000000000000000000000000") {
                eventObject = {
                  event_type: 'mint',
                  created_date,
                  from_account: "0x123",
                  to_account: address,
                  sale_amount,
                  list_amount,
                  to_account_eth_address: event.to_account.address
                };
              }
              else {
                eventObject = {
                  event_type,
                  created_date,
                  from_account,
                  to_account: address,
                  sale_amount,
                  list_amount,
                  to_account_eth_address: event.to_account.address
                };
              }
            })
          break;
        case "successful":
          created_date = event.created_date;
          from_account = "0x123";
          to_account = "0x123";
          let tempSale = fromWei(parseInt(event.total_price));
          sale_amount = handleSignificantDecimals(tempSale, 5)
          list_amount = "0";
  
          eventObject = {
            event_type,
            created_date,
            from_account,
            to_account,
            sale_amount,
            list_amount,
            to_account_eth_address
          };

          break;

        case "cancelled":
          created_date = event.created_date;
          from_account = "0x123";
          to_account = "0x123";
          sale_amount = "0";
          list_amount = "0";
  
          eventObject = {
            event_type,
            created_date,
            from_account,
            to_account,
            sale_amount,
            list_amount,
            to_account_eth_address
          };

          break;
      }
      
      return eventObject;
    }))
    
  } catch (error) {
    logger.log(error);
    throw error;
  }
};
