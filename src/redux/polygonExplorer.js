import { BigNumber } from '@ethersproject/bignumber';
import { Contract } from '@ethersproject/contracts';
import { JsonRpcProvider } from '@ethersproject/providers';
import { toLower } from 'lodash';
// eslint-disable-next-line import/no-cycle
import { addressAssetsReceived, fetchAssetPrices } from './data';
// eslint-disable-next-line import/no-cycle
import { emitAssetRequest, emitChartsRequest } from './explorer';
import networkInfo from '@rainbow-me/helpers/networkInfo';
import networkTypes from '@rainbow-me/helpers/networkTypes';
import {
  balanceCheckerContractAbi,
  testnetAssets,
} from '@rainbow-me/references';
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

const polygonProvider = new JsonRpcProvider(POLYGON_MAINNET_RPC_ENDPOINT);

const network = networkTypes.polygon;

const fetchAssetBalances = async (tokens, address) => {
  const abi = balanceCheckerContractAbi;

  const contractAddress = networkInfo[network].balance_checker_contract_address;

  const balanceCheckerContract = new Contract(
    contractAddress,
    abi,
    polygonProvider
  );

  try {
    const values = await balanceCheckerContract.balances([address], tokens);
    const balances = {};
    [address].forEach((addr, addrIdx) => {
      balances[addr] = {};
      tokens.forEach((tokenAddr, tokenIdx) => {
        const balance = values[addrIdx * tokens.length + tokenIdx];
        balances[addr][tokenAddr] = balance.toString();
      });
    });
    return balances[address];
  } catch (e) {
    logger.log(
      'Error fetching balances from balanceCheckerContract',
      network,
      e
    );
    return null;
  }
};

// const fetchAssetsMapping = async () => {
//   try {
//     const url =
//       'https://tokenmapper.api.matic.today/api/v1/mapping?map_type=[%22POS%22]&chain_id=137&limit=5000&offset=0';
//     const request = await fetch(url);
//     return request.json();
//   } catch (e) {
//     logger.log(`Error trying to fetch polygon token map`, e);
//   }
// };

export const polygonExplorerInit = () => async (dispatch, getState) => {
  const { assets: allAssets, genericAssets } = getState().data;
  const { accountAddress, nativeCurrency } = getState().settings;
  const formattedNativeCurrency = toLower(nativeCurrency);

  const fetchAssetsBalancesAndPrices = async () => {
    logger.log('🟣 polygonExplorer fetchAssetsBalancesAndPrices');
    const assets = testnetAssets[network];
    // TODO - From the list of mappins, filter the tokens that are in the account

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

    const prices = await fetchAssetPrices(
      assets.map(({ asset: { coingecko_id } }) => coingecko_id),
      formattedNativeCurrency
    );

    if (prices) {
      Object.keys(prices).forEach(key => {
        for (let i = 0; i < assets.length; i++) {
          if (toLower(assets[i].asset.coingecko_id) === toLower(key)) {
            const asset =
              ethereumUtils.getAsset(
                allAssets,
                toLower(assets[i].asset.mainnet_address)
              ) || genericAssets[toLower(assets[i].asset.mainnet_address)];

            assets[i].asset.price = asset?.price || {
              changed_at: prices[key].last_updated_at,
              relative_change_24h:
                prices[key][`${formattedNativeCurrency}_24h_change`],
              value: prices[key][`${formattedNativeCurrency}`],
            };
            break;
          }
        }
      });
    }
    const balances = await fetchAssetBalances(
      assets.map(({ asset: { asset_code } }) => asset_code),
      accountAddress,
      network
    );

    let total = BigNumber.from(0);

    if (balances) {
      Object.keys(balances).forEach(key => {
        for (let i = 0; i < assets.length; i++) {
          if (assets[i].asset.asset_code.toLowerCase() === key.toLowerCase()) {
            assets[i].quantity = balances[key];
            break;
          }
        }
        total = total.add(balances[key]);
      });
    }

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
