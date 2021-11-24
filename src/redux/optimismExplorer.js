import { BigNumber } from '@ethersproject/bignumber';
import { Contract } from '@ethersproject/contracts';
import { toLower } from 'lodash';
import isEqual from 'react-fast-compare';
// eslint-disable-next-line import/no-cycle
import { addressAssetsReceived, fetchAssetPricesWithCoingecko } from './data';
// eslint-disable-next-line import/no-cycle
import { emitAssetRequest, emitChartsRequest } from './explorer';
import { getProviderForNetwork } from '@rainbow-me/handlers/web3';
import networkInfo from '@rainbow-me/helpers/networkInfo';
import networkTypes from '@rainbow-me/helpers/networkTypes';
import {
  balanceCheckerContractAbiOVM,
  chainAssets,
} from '@rainbow-me/references';
import { ethereumUtils } from '@rainbow-me/utils';
import logger from 'logger';

let lastUpdatePayload = null;
// -- Constants --------------------------------------- //
const OPTIMISM_EXPLORER_CLEAR_STATE = 'explorer/OPTIMISM_EXPLORER_CLEAR_STATE';
const OPTIMISM_EXPLORER_SET_BALANCE_HANDLER =
  'explorer/OPTIMISM_EXPLORER_SET_BALANCE_HANDLER';
const OPTIMISM_EXPLORER_SET_HANDLERS =
  'explorer/OPTIMISM_EXPLORER_SET_HANDLERS';

const UPDATE_BALANCE_AND_PRICE_FREQUENCY = 60000;

const network = networkTypes.optimism;

const fetchAssetBalances = async (tokens, address) => {
  try {
    const abi = balanceCheckerContractAbiOVM;

    const contractAddress =
      networkInfo[network].balance_checker_contract_address;
    const optimismProvider = await getProviderForNetwork(networkTypes.optimism);

    const balanceCheckerContract = new Contract(
      contractAddress,
      abi,
      optimismProvider
    );
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

export const optimismExplorerInit = () => async (dispatch, getState) => {
  if (networkInfo[networkTypes.optimism]?.disabled) return;
  const { assets: allAssets, genericAssets } = getState().data;
  const { accountAddress, nativeCurrency } = getState().settings;
  const formattedNativeCurrency = toLower(nativeCurrency);

  const fetchAssetsBalancesAndPrices = async () => {
    logger.debug(
      'OPITMISM fetchAssetBalancesAndPrices lastPayloadValue 1',
      lastUpdatePayload?.assets[0].quantity
    );
    const assets = [...chainAssets[network]];
    if (!assets || !assets.length) {
      const optimismExplorerBalancesHandle = setTimeout(
        fetchAssetsBalancesAndPrices,
        10000
      );
      dispatch({
        payload: {
          optimismExplorerBalancesHandle,
        },
        type: OPTIMISM_EXPLORER_SET_BALANCE_HANDLER,
      });
      return;
    }

    logger.debug(
      'OPITMISM fetchAssetBalancesAndPrices lastPayloadValue 2',
      lastUpdatePayload?.assets[0].quantity
    );
    const tokenAddresses = assets.map(
      ({ asset: { asset_code } }) => asset_code
    );
    logger.debug(
      'OPITMISM fetchAssetBalancesAndPrices lastPayloadValue 3',
      lastUpdatePayload?.assets[0].quantity
    );
    const balances = await fetchAssetBalances(
      assets.map(({ asset: { asset_code } }) => asset_code),
      accountAddress,
      network
    );
    logger.debug(
      'OPITMISM fetchAssetBalancesAndPrices lastPayloadValue 4',
      lastUpdatePayload?.assets[0].quantity
    );

    let total = BigNumber.from(0);
    logger.debug(
      'OPITMISM fetchAssetBalancesAndPrices lastPayloadValue 5',
      lastUpdatePayload?.assets[0].quantity
    );
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
    logger.debug(
      'OPITMISM fetchAssetBalancesAndPrices lastPayloadValue 6',
      lastUpdatePayload?.assets[0].quantity
    );
    const assetsWithBalance = [...assets.filter(asset => asset.quantity > 0)];
    logger.debug(
      'OPITMISM fetchAssetBalancesAndPrices lastPayloadValue 7',
      lastUpdatePayload?.assets[0].quantity
    );
    if (assetsWithBalance.length) {
      dispatch(emitAssetRequest(tokenAddresses));
      dispatch(emitChartsRequest(tokenAddresses));
      const prices = await fetchAssetPricesWithCoingecko(
        assetsWithBalance.map(({ asset: { coingecko_id } }) => coingecko_id),
        formattedNativeCurrency
      );
      logger.debug(
        'OPITMISM fetchAssetBalancesAndPrices lastPayloadValue 8',
        lastUpdatePayload?.assets[0].quantity
      );

      if (prices) {
        logger.debug(
          'OPITMISM fetchAssetBalancesAndPrices lastPayloadValue 9',
          lastUpdatePayload?.assets[0].quantity
        );
        Object.keys(prices).forEach(key => {
          for (let i = 0; i < assetsWithBalance.length; i++) {
            if (
              toLower(assetsWithBalance[i].asset.coingecko_id) === toLower(key)
            ) {
              const asset =
                ethereumUtils.getAsset(
                  allAssets,
                  toLower(assetsWithBalance[i].asset.mainnet_address)
                ) ||
                genericAssets[
                  toLower(assetsWithBalance[i].asset.mainnet_address)
                ];
              assetsWithBalance[i].asset.network = networkTypes.optimism;
              assetsWithBalance[i].asset.price = asset?.price || {
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

      logger.debug(
        'OPITMISM fetchAssetBalancesAndPrices lastPayloadValue 1',
        lastUpdatePayload?.assets[0].quantity
      );
      const newPayload = { assets: [...assetsWithBalance] };

      logger.debug('OPTIMISM balance vs old', {
        new: newPayload.assets[0].quantity,
        old: lastUpdatePayload?.assets[0].quantity,
      });

      if (!isEqual(lastUpdatePayload, newPayload)) {
        logger.debug('OPTIMISM dispatching');
        dispatch(
          addressAssetsReceived(
            {
              meta: {
                address: accountAddress,
                currency: nativeCurrency,
                status: 'ok',
              },
              payload: newPayload,
            },
            false,
            false,
            false,
            networkTypes.optimism
          )
        );
        logger.debug('OPTIISM UPDATING lastUpdatePayload');
        lastUpdatePayload = { ...newPayload };
      }
    }

    const optimismExplorerBalancesHandle = setTimeout(
      fetchAssetsBalancesAndPrices,
      !assetsWithBalance.length
        ? UPDATE_BALANCE_AND_PRICE_FREQUENCY * 2
        : UPDATE_BALANCE_AND_PRICE_FREQUENCY
    );
    let optimismExplorerAssetsHandle = null;

    dispatch({
      payload: {
        optimismExplorerAssetsHandle,
        optimismExplorerBalancesHandle,
      },
      type: OPTIMISM_EXPLORER_SET_HANDLERS,
    });
  };
  fetchAssetsBalancesAndPrices();
};

export const optimismExplorerClearState = () => (dispatch, getState) => {
  const {
    optimismExplorerBalancesHandle,
    optimismExplorerAssetsHandle,
  } = getState().optimismExplorer;

  optimismExplorerBalancesHandle &&
    clearTimeout(optimismExplorerBalancesHandle);
  optimismExplorerAssetsHandle && clearTimeout(optimismExplorerAssetsHandle);
  dispatch({ type: OPTIMISM_EXPLORER_CLEAR_STATE });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  optimismExplorerAssetsHandle: null,
  optimismExplorerBalancesHandle: null,
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case OPTIMISM_EXPLORER_CLEAR_STATE:
      return {
        ...state,
        ...INITIAL_STATE,
      };
    case OPTIMISM_EXPLORER_SET_HANDLERS:
      return {
        ...state,
        optimismExplorerAssetsHandle:
          action.payload.optimismExplorerAssetsHandle,
        optimismExplorerBalancesHandle:
          action.payload.optimismExplorerBalancesHandle,
      };
    case OPTIMISM_EXPLORER_SET_BALANCE_HANDLER:
      return {
        ...state,
        optimismExplorerBalancesHandle:
          action.payload.optimismExplorerBalancesHandle,
      };
    default:
      return state;
  }
};
