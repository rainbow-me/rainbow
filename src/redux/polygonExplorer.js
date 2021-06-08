// import { Contract } from '@ethersproject/contracts';
// import { JsonRpcProvider } from '@ethersproject/providers';
import { delay, toLower } from 'lodash';
import {
  COVALENT_ANDROID_API_KEY,
  COVALENT_IOS_API_KEY,
} from 'react-native-dotenv';
// eslint-disable-next-line import/no-cycle
import { addressAssetsReceived } from './data';
// eslint-disable-next-line import/no-cycle
import { emitAssetRequest, emitChartsRequest } from './explorer';
import { AssetTypes } from '@rainbow-me/entities';
//import networkInfo from '@rainbow-me/helpers/networkInfo';
import networkTypes from '@rainbow-me/helpers/networkTypes';
import { ethereumUtils } from '@rainbow-me/utils';
import logger from 'logger';

// -- Constants --------------------------------------- //
export const POLYGON_MAINNET_RPC_ENDPOINT = 'https://rpc-mainnet.matic.network';
const POLYGON_EXPLORER_CLEAR_STATE = 'explorer/POLYGON_EXPLORER_CLEAR_STATE';
const POLYGON_EXPLORER_SET_ASSETS = 'explorer/POLYGON_EXPLORER_SET_ASSETS';
const POLYGON_EXPLORER_SET_BALANCE_HANDLER =
  'explorer/POLYGON_EXPLORER_SET_BALANCE_HANDLER';
const POLYGON_EXPLORER_SET_HANDLERS = 'explorer/POLYGON_EXPLORER_SET_HANDLERS';
const POLYGON_EXPLORER_SET_LATEST_TX_BLOCK_NUMBER =
  'explorer/POLYGON_EXPLORER_SET_LATEST_TX_BLOCK_NUMBER';

const UPDATE_BALANCE_AND_PRICE_FREQUENCY = 30000;

// const polygonProvider = new JsonRpcProvider(POLYGON_MAINNET_RPC_ENDPOINT);

const network = networkTypes.polygon;

// const fetchAssetBalances = async (tokens, address) => {
//   const abi = balanceCheckerContractAbi;

//   const contractAddress = networkInfo[network].balance_checker_contract_address;

//   const balanceCheckerContract = new Contract(
//     contractAddress,
//     abi,
//     polygonProvider
//   );

//   try {
//     const values = await balanceCheckerContract.balances([address], tokens);
//     const balances = {};
//     [address].forEach((addr, addrIdx) => {
//       balances[addr] = {};
//       tokens.forEach((tokenAddr, tokenIdx) => {
//         const balance = values[addrIdx * tokens.length + tokenIdx];
//         balances[addr][tokenAddr] = balance.toString();
//       });
//     });
//     return balances[address];
//   } catch (e) {
//     logger.log(
//       'Error fetching balances from balanceCheckerContract',
//       network,
//       e
//     );
//     return null;
//   }
// };

const fetchAssetsMapping = async () => {
  const fetchPage = async page => {
    try {
      const limit = 200;
      const url = `https://tokenmapper.api.matic.today/api/v1/mapping?map_type=[%22POS%22]&chain_id=137&limit=${limit}&offset=${
        limit * page
      }`;
      const request = await fetch(url);
      const response = await request.json();
      if (response.message === 'success') {
        return response.data;
      }
      return null;
    } catch (e) {
      logger.log(`Error trying to fetch polygon token map`, e);
      return null;
    }
  };

  let next = true;
  let page = 0;
  let fullMapping = [];
  while (next) {
    const pageData = await fetchPage(page);
    next = pageData.has_next_page;
    fullMapping = fullMapping.concat(pageData.mapping);
    if (next) {
      await delay(500);
    }
  }

  const tokenMapping = fullMapping.map(mappingData => ({
    [mappingData.child_token]: mappingData.root_token,
  }));

  logger.log('GOT MATIC MAPPING!', tokenMapping);
  return tokenMapping;
};

const getAssetsFromCovalent = async (chainId, address, type, currency) => {
  const url = `https://api.covalenthq.com/v1/${chainId}/address/${address}/balances_v2/?nft=false&quote-currency=${currency}&key=${
    ios ? COVALENT_IOS_API_KEY : COVALENT_ANDROID_API_KEY
  }`;
  const request = await fetch(url);
  const response = await request.json();
  //{"data":{"address":"0x7a3d05c70581bd345fe117c06e45f9669205384f","updated_at":"2021-06-08T06:39:19.441647639Z","next_update_at":"2021-06-08T06:44:19.441648259Z","quote_currency":"USD","chain_id":137,"items":[{"contract_decimals":18,"contract_name":"Wrapped Ether","contract_ticker_symbol":"WETH","contract_address":"0x7ceb23fd6bc0add59e62ac25578270cff1b9f619","supports_erc":["erc20"],"logo_url":"https://logos.covalenthq.com/tokens/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png","type":"cryptocurrency","balance":"5000000000000000","quote_rate":2490.5676,"quote":12.452838,"nft_data":null},{"contract_decimals":18,"contract_name":"Matic Token","contract_ticker_symbol":"MATIC","contract_address":"0x0000000000000000000000000000000000001010","supports_erc":["erc20"],"logo_url":"https://logos.covalenthq.com/tokens/0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0.png","type":"cryptocurrency","balance":"7106992345774382475","quote_rate":1.416582,"quote":10.067637,"nft_data":null}],"pagination":null},"error":false,"error_message":null,"error_code":null}
  if (response.data && !response.error) {
    const tokenMapping = await fetchAssetsMapping();
    const updatedAt = new Date(response.data.update_at).getTime();

    const assets = response.data.items.forEach(item => ({
      asset: {
        asset_code: item.contract_address,
        coingecko_id: null,
        decimals: item.contract_decimals,
        icon_url: item.logo_url,
        mainnet_address: tokenMapping[item.contract_address],
        name: item.contract_name,
        price: {
          changed_at: updatedAt,
          relative_change_24h: 0, // TODO - Get this from somewhere
          value: item.quote,
        },
        symbol: item.contract_ticker_symbol,
        type,
      },
      quantity: item.balance,
    }));

    logger.log('MATIC ASSETS WITH BALANCE!', assets);

    return assets;
  }
  return null;
};

export const polygonExplorerInit = () => async (dispatch, getState) => {
  const { accountAddress, nativeCurrency } = getState().settings;
  const formattedNativeCurrency = toLower(nativeCurrency);

  const fetchAssetsBalancesAndPrices = async () => {
    logger.log('🟣 polygonExplorer fetchAssetsBalancesAndPrices');
    //const assets = testnetAssets[network];
    const chainId = ethereumUtils.getChainIdFromNetwork(network);
    const assets = await getAssetsFromCovalent(
      chainId,
      accountAddress,
      AssetTypes.polygon,
      formattedNativeCurrency
    );

    if (!assets || !assets.length) {
      const polygonExplorerBalancesHandle = setTimeout(
        fetchAssetsBalancesAndPrices,
        10000
      );
      dispatch({
        payload: {
          polygonExplorerBalancesHandle,
        },
        type: POLYGON_EXPLORER_SET_BALANCE_HANDLER,
      });
      return;
    }

    const tokenAddresses = assets.map(
      ({ asset: { asset_code } }) => asset_code
    );

    dispatch(emitAssetRequest(tokenAddresses));
    dispatch(emitChartsRequest(tokenAddresses));

    // const prices = await fetchAssetPrices(
    //   assets.map(({ asset: { coingecko_id } }) => coingecko_id),
    //   formattedNativeCurrency
    // );

    // if (prices) {
    //   Object.keys(prices).forEach(key => {
    //     for (let i = 0; i < assets.length; i++) {
    //       if (toLower(assets[i].asset.coingecko_id) === toLower(key)) {
    //         const asset =
    //           ethereumUtils.getAsset(
    //             allAssets,
    //             toLower(assets[i].asset.mainnet_address)
    //           ) || genericAssets[toLower(assets[i].asset.mainnet_address)];

    //         assets[i].asset.price = asset?.price || {
    //           changed_at: prices[key].last_updated_at,
    //           relative_change_24h:
    //             prices[key][`${formattedNativeCurrency}_24h_change`],
    //           value: prices[key][`${formattedNativeCurrency}`],
    //         };
    //         break;
    //       }
    //     }
    //   });
    // }
    // const balances = await fetchAssetBalances(
    //   assets.map(({ asset: { asset_code } }) => asset_code),
    //   accountAddress,
    //   network
    // );

    // let total = BigNumber.from(0);

    // if (balances) {
    //   Object.keys(balances).forEach(key => {
    //     for (let i = 0; i < assets.length; i++) {
    //       if (assets[i].asset.asset_code.toLowerCase() === key.toLowerCase()) {
    //         assets[i].quantity = balances[key];
    //         break;
    //       }
    //     }
    //     total = total.add(balances[key]);
    //   });
    // }

    logger.log('🟣 polygonExplorer updating assets');
    dispatch(
      addressAssetsReceived(
        {
          meta: {
            address: accountAddress,
            currency: nativeCurrency,
            status: 'ok',
          },
          payload: { assets },
        },
        true
      )
    );

    const polygonExplorerBalancesHandle = setTimeout(
      fetchAssetsBalancesAndPrices,
      UPDATE_BALANCE_AND_PRICE_FREQUENCY
    );
    let polygonExplorerAssetsHandle = null;

    dispatch({
      payload: {
        polygonExplorerAssetsHandle,
        polygonExplorerBalancesHandle,
      },
      type: POLYGON_EXPLORER_SET_HANDLERS,
    });
  };
  fetchAssetsBalancesAndPrices();
};

export const polygonExplorerClearState = () => (dispatch, getState) => {
  const {
    polygonExplorerBalancesHandle,
    polygonExplorerAssetsHandle,
  } = getState().polygonExplorer;

  polygonExplorerBalancesHandle && clearTimeout(polygonExplorerBalancesHandle);
  polygonExplorerAssetsHandle && clearTimeout(polygonExplorerAssetsHandle);
  dispatch({ type: POLYGON_EXPLORER_CLEAR_STATE });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  assetsFound: [],
  polygonExplorerAssetsHandle: null,
  polygonExplorerBalancesHandle: null,
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case POLYGON_EXPLORER_SET_ASSETS:
      return {
        ...state,
        assetsFound: action.payload.assetsFound,
      };
    case POLYGON_EXPLORER_CLEAR_STATE:
      return {
        ...state,
        ...INITIAL_STATE,
      };
    case POLYGON_EXPLORER_SET_LATEST_TX_BLOCK_NUMBER:
      return {
        ...state,
        latestTxBlockNumber: action.payload.latestTxBlockNumber,
      };
    case POLYGON_EXPLORER_SET_HANDLERS:
      return {
        ...state,
        polygonExplorerAssetsHandle: action.payload.polygonExplorerAssetsHandle,
        polygonExplorerBalancesHandle:
          action.payload.polygonExplorerBalancesHandle,
      };
    case POLYGON_EXPLORER_SET_BALANCE_HANDLER:
      return {
        ...state,
        polygonExplorerBalancesHandle:
          action.payload.polygonExplorerBalancesHandle,
      };
    default:
      return state;
  }
};
