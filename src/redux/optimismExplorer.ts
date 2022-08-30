import { Contract } from '@ethersproject/contracts';
import { captureException } from '@sentry/react-native';
import { isEmpty, keyBy, mapValues } from 'lodash';
import isEqual from 'react-fast-compare';
import { Dispatch } from 'redux';
import { ThunkDispatch } from 'redux-thunk';
import {
  addressAssetsReceived,
  DISPERSION_SUCCESS_CODE,
  fetchAssetPricesWithCoingecko,
} from './data';
import { emitAssetRequest, emitChartsRequest } from './explorer';
import { AppGetState, AppState } from './store';
import { ZerionAsset } from '@/entities';
import { getProviderForNetwork } from '@/handlers/web3';
import networkInfo from '@/helpers/networkInfo';
import { Network } from '@/helpers/networkTypes';
import { pickBy } from '@/helpers/utilities';
import { balanceCheckerContractAbiOVM, chainAssets } from '@/references';
import logger from '@/utils/logger';

/**
 * The last `ChainAsset`s update payload. Used for skipping redundant payloads.
 */
let lastUpdatePayload: {
  assets: {
    [key in Network]?: ChainAsset;
  };
} | null = null;

// -- Constants --------------------------------------- //
const OPTIMISM_EXPLORER_CLEAR_STATE = 'explorer/OPTIMISM_EXPLORER_CLEAR_STATE';
const OPTIMISM_EXPLORER_SET_HANDLERS =
  'explorer/OPTIMISM_EXPLORER_SET_HANDLERS';

const UPDATE_BALANCE_AND_PRICE_FREQUENCY = 60000;

// -- Types ------------------------------------------- //

/**
 * The state for the `optimismExplorer` reducer.
 */
interface OptimismExplorerState {
  /**
   * A handler for the balance-fetching timeout, or `null` if the timeout
   * has not been started.
   */
  optimismExplorerBalancesHandle: ReturnType<typeof setTimeout> | null;
}

/**
 * An chain asset's data, which extends from `ZerionAsset` but also includes
 * a `coingecko_id` and `mainnet_address`.
 */
interface ChainAssetData extends ZerionAsset {
  coingecko_id: string;
  mainnet_address: string;
}

/**
 * A chain asset, including its asset data and balance quantity.
 */
interface ChainAsset {
  asset: ChainAssetData;
  quantity: string | number;
}

// -- Actions ----------------------------------------- //

/**
 * The action for updating the asset or balance timeout handles in state.
 */
interface OptimismExplorerSetHandlersAction {
  type: typeof OPTIMISM_EXPLORER_SET_HANDLERS;
  payload: {
    optimismExplorerBalancesHandle: OptimismExplorerState['optimismExplorerBalancesHandle'];
  };
}

/**
 * The action for clearing the state of the `optimismExplorer` reducer.
 */
interface OptimismExplorerClearStateAction {
  type: typeof OPTIMISM_EXPLORER_CLEAR_STATE;
}

/**
 * An action for the `optimismExplorer` reducer.
 */
type OptimismExplorerAction =
  | OptimismExplorerSetHandlersAction
  | OptimismExplorerClearStateAction;

/**
 * Fetches asset balances on the Optimism network.
 *
 * @param tokens The tokens addresses to fetch balances for.
 * @param address The address to fetch the balance of.
 * @returns An object containing token addresses as keys and balance strings as
 * values, or `null` if an error occurs.
 */
const fetchAssetBalances = async (
  tokens: string[],
  address: string
): Promise<{
  [tokenAddress: string]: string;
} | null> => {
  try {
    const abi = balanceCheckerContractAbiOVM;

    const contractAddress =
      networkInfo[Network.optimism].balance_checker_contract_address;
    const optimismProvider = await getProviderForNetwork(Network.optimism);

    const balanceCheckerContract = new Contract(
      contractAddress,
      abi,
      optimismProvider
    );
    const values = await balanceCheckerContract.balances([address], tokens);
    const balances: {
      [address: string]: {
        [tokenAddress: string]: string;
      };
    } = {};
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
      Network.optimism,
      e
    );
    captureException(new Error('fallbackExplorer::balanceChecker failure'));
    return null;
  }
};

/**
 * Initializes the Optimism explorer by loading assets, balances, and charts
 * and updating state accordingly.
 */
export const optimismExplorerInit = () => async (
  dispatch: ThunkDispatch<AppState, unknown, OptimismExplorerSetHandlersAction>,
  getState: AppGetState
) => {
  if (networkInfo[Network.optimism]?.disabled) return;
  const { accountAddress, nativeCurrency } = getState().settings;
  const formattedNativeCurrency = nativeCurrency.toLowerCase();

  const fetchAssetsBalancesAndPrices = async () => {
    const assets = keyBy(
      chainAssets[Network.optimism] as ChainAsset[],
      asset => `${asset.asset.asset_code}_${Network.optimism}`
    );

    const tokenAddresses = Object.values(
      assets
    ).map(({ asset: { asset_code } }) => asset_code.toLowerCase());

    const balances = await fetchAssetBalances(tokenAddresses, accountAddress);

    let updatedAssets = assets;
    if (balances) {
      updatedAssets = mapValues(assets, assetAndQuantity => {
        const assetCode = assetAndQuantity.asset.asset_code.toLowerCase();
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
          const assetCoingeckoId = assetWithBalance.asset.coingecko_id.toLowerCase();
          if (prices[assetCoingeckoId]) {
            return {
              ...assetWithBalance,
              asset: {
                ...assetWithBalance.asset,
                // It is technically possible for `asset?.price` to be defined
                // but have undefined values. However, in this case we assume
                // that either `asset?.price` is defined with values, or it's
                // undefined and we use the fallback.
                price: {
                  changed_at: prices[assetCoingeckoId].last_updated_at,
                  relative_change_24h:
                    prices[assetCoingeckoId][
                      `${formattedNativeCurrency}_24h_change`
                    ],
                  value: prices[assetCoingeckoId][formattedNativeCurrency],
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
                status: DISPERSION_SUCCESS_CODE,
              },
              payload: newPayload,
            },
            false,
            false,
            false,
            Network.optimism
          )
        );
        lastUpdatePayload = newPayload;
      }
    }

    const optimismExplorerBalancesHandle = setTimeout(
      fetchAssetsBalancesAndPrices,
      // This seems incorrect, as `assetsWithBalance` is an object, not an array.
      // However, since `assetsWithBalance` technically maps strings to assets,
      // it does compile.
      !assetsWithBalance.length
        ? UPDATE_BALANCE_AND_PRICE_FREQUENCY * 2
        : UPDATE_BALANCE_AND_PRICE_FREQUENCY
    );

    dispatch({
      payload: {
        optimismExplorerBalancesHandle,
      },
      type: OPTIMISM_EXPLORER_SET_HANDLERS,
    });
  };
  fetchAssetsBalancesAndPrices();
};

/**
 * Clears the state of the Optimism explorer and clears any timeouts.
 */
export const optimismExplorerClearState = () => (
  dispatch: Dispatch<OptimismExplorerClearStateAction>,
  getState: AppGetState
) => {
  const { optimismExplorerBalancesHandle } = getState().optimismExplorer;

  optimismExplorerBalancesHandle &&
    clearTimeout(optimismExplorerBalancesHandle);
  dispatch({ type: OPTIMISM_EXPLORER_CLEAR_STATE });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE: OptimismExplorerState = {
  optimismExplorerBalancesHandle: null,
};

export default (state = INITIAL_STATE, action: OptimismExplorerAction) => {
  switch (action.type) {
    case OPTIMISM_EXPLORER_CLEAR_STATE:
      return {
        ...state,
        ...INITIAL_STATE,
      };
    case OPTIMISM_EXPLORER_SET_HANDLERS:
      return {
        ...state,
        optimismExplorerBalancesHandle:
          action.payload.optimismExplorerBalancesHandle,
      };
    default:
      return state;
  }
};
