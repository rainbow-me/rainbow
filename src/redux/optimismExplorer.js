import { Contract } from '@ethersproject/contracts';
import { captureException } from '@sentry/react-native';
import { isEmpty, keyBy, mapValues, toLower } from 'lodash';
import isEqual from 'react-fast-compare';
import { addressAssetsReceived, fetchAssetPricesWithCoingecko } from './data';
// eslint-disable-next-line import/no-cycle
import { emitAssetRequest, emitChartsRequest } from './explorer';
import { getProviderForNetwork } from '@rainbow-me/handlers/web3';
import networkInfo from '@rainbow-me/helpers/networkInfo';
import networkTypes from '@rainbow-me/helpers/networkTypes';
import { pickBy } from '@rainbow-me/helpers/utilities';
import {
  balanceCheckerContractAbiOVM,
  chainAssets,
} from '@rainbow-me/references';
import logger from 'logger';

let lastUpdatePayload = null;
// -- Constants --------------------------------------- //
const OPTIMISM_EXPLORER_CLEAR_STATE = 'explorer/OPTIMISM_EXPLORER_CLEAR_STATE';
const OPTIMISM_EXPLORER_SET_BALANCE_HANDLER =
  'explorer/OPTIMISM_EXPLORER_SET_BALANCE_HANDLER';
const OPTIMISM_EXPLORER_SET_HANDLERS =
  'explorer/OPTIMISM_EXPLORER_SET_HANDLERS';

const UPDATE_BALANCE_AND_PRICE_FREQUENCY = 60000;

const optimismNetwork = networkTypes.optimism;

const fetchAssetBalances = async (tokens, address) => {
  try {
    const abi = balanceCheckerContractAbiOVM;

    const contractAddress =
      networkInfo[optimismNetwork].balance_checker_contract_address;
    const optimismProvider = await getProviderForNetwork(optimismNetwork);

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
    logger.sentry(
      'Error fetching balances from balanceCheckerContract',
      optimismNetwork,
      e
    );
    captureException(new Error('fallbackExplorer::balanceChecker failure'));
    return null;
  }
};

export const optimismExplorerInit = () => async (dispatch, getState) => {
  if (networkInfo[optimismNetwork]?.disabled) return;
  const { accountAddress, nativeCurrency } = getState().settings;
  const formattedNativeCurrency = toLower(nativeCurrency);

  const fetchAssetsBalancesAndPrices = async () => {
    const assets = keyBy(
      chainAssets[optimismNetwork],
      asset => `${asset.asset.asset_code}_${optimismNetwork}`
    );

    const tokenAddresses = Object.values(
      assets
    ).map(({ asset: { asset_code } }) => toLower(asset_code));

    const balances = await fetchAssetBalances(
      tokenAddresses,
      accountAddress,
      optimismNetwork
    );

    let updatedAssets = assets;
    if (balances) {
      updatedAssets = mapValues(assets, assetAndQuantity => {
        const assetCode = toLower(assetAndQuantity.asset.asset_code);
        return {
          asset: {
            ...assetAndQuantity.asset,
          },
          quantity: balances?.[assetCode],
        };
      });
    }

    let assetsWithBalance = pickBy(updatedAssets, asset => asset.quantity > 0);

    if (!isEmpty(assetsWithBalance)) {
      dispatch(emitAssetRequest(tokenAddresses));
      dispatch(emitChartsRequest(tokenAddresses));

      const coingeckoIds = Object.values(assetsWithBalance).map(
        ({ asset }) => asset.coingecko_id
      );
      const prices = await fetchAssetPricesWithCoingecko(
        coingeckoIds,
        formattedNativeCurrency
      );

      if (prices) {
        assetsWithBalance = mapValues(assetsWithBalance, assetWithBalance => {
          const assetCoingeckoId = toLower(assetWithBalance.asset.coingecko_id);
          if (prices[assetCoingeckoId]) {
            return {
              ...assetWithBalance,
              asset: {
                ...assetWithBalance.asset,
                price: {
                  changed_at: prices[assetCoingeckoId].last_updated_at,
                  relative_change_24h:
                    prices[assetCoingeckoId][
                      `${formattedNativeCurrency}_24h_change`
                    ],
                  value: prices[assetCoingeckoId][`${formattedNativeCurrency}`],
                },
              },
            };
          }
          return assetWithBalance;
        });
      }

      const newPayload = { assets: assetsWithBalance };

      if (balances && !isEqual(lastUpdatePayload, newPayload)) {
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
            optimismNetwork
          )
        );
        lastUpdatePayload = newPayload;
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
