import { Contract } from '@ethersproject/contracts';
import { toLower } from 'lodash';
import isEqual from 'react-fast-compare';
// eslint-disable-next-line import/no-cycle
import { addressAssetsReceived, fetchAssetPricesWithCoingecko } from './data';
// eslint-disable-next-line import/no-cycle
import { emitAssetRequest, emitChartsRequest } from './explorer';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/web3' or ... Remove this comment to see the full error message
import { getProviderForNetwork } from '@rainbow-me/handlers/web3';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/networkInf... Remove this comment to see the full error message
import networkInfo from '@rainbow-me/helpers/networkInfo';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/networkTyp... Remove this comment to see the full error message
import networkTypes from '@rainbow-me/helpers/networkTypes';
import {
  balanceCheckerContractAbiOVM,
  chainAssets,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/references' or its... Remove this comment to see the full error message
} from '@rainbow-me/references';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { ethereumUtils } from '@rainbow-me/utils';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'logger' or its corresponding t... Remove this comment to see the full error message
import logger from 'logger';

let lastUpdatePayload: any = null;
// -- Constants --------------------------------------- //
const OPTIMISM_EXPLORER_CLEAR_STATE = 'explorer/OPTIMISM_EXPLORER_CLEAR_STATE';
const OPTIMISM_EXPLORER_SET_BALANCE_HANDLER =
  'explorer/OPTIMISM_EXPLORER_SET_BALANCE_HANDLER';
const OPTIMISM_EXPLORER_SET_HANDLERS =
  'explorer/OPTIMISM_EXPLORER_SET_HANDLERS';

const UPDATE_BALANCE_AND_PRICE_FREQUENCY = 60000;

const network = networkTypes.optimism;

const fetchAssetBalances = async (tokens: any, address: any) => {
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
      // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      balances[addr] = {};
      tokens.forEach((tokenAddr: any, tokenIdx: any) => {
        const balance = values[addrIdx * tokens.length + tokenIdx];
        // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        balances[addr][tokenAddr] = balance.toString();
      });
    });
    // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
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

export const optimismExplorerInit = () => async (
  dispatch: any,
  getState: any
) => {
  if (networkInfo[networkTypes.optimism]?.disabled) return;
  const { assets: allAssets, genericAssets } = getState().data;
  const { accountAddress, nativeCurrency } = getState().settings;
  const formattedNativeCurrency = toLower(nativeCurrency);

  const fetchAssetsBalancesAndPrices = async () => {
    const assets = chainAssets[network];
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

    const tokenAddresses = assets.map(({ asset: { asset_code } }: any) =>
      toLower(asset_code)
    );

    const balances = await fetchAssetBalances(
      tokenAddresses,
      accountAddress,
      // @ts-expect-error ts-migrate(2554) FIXME: Expected 2 arguments, but got 3.
      network
    );

    let updatedAssets = assets;
    if (balances) {
      updatedAssets = assets.map((assetAndQuantity: any) => {
        const assetCode = toLower(assetAndQuantity.asset.asset_code);
        return {
          asset: {
            ...assetAndQuantity.asset,
          },
          quantity: balances?.[assetCode],
        };
      });
    }

    const assetsWithBalance = updatedAssets.filter(
      (asset: any) => asset.quantity > 0
    );

    if (assetsWithBalance.length) {
      dispatch(emitAssetRequest(tokenAddresses));
      // @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 1.
      dispatch(emitChartsRequest(tokenAddresses));
      const prices = await fetchAssetPricesWithCoingecko(
        assetsWithBalance.map(
          ({ asset: { coingecko_id } }: any) => coingecko_id
        ),
        formattedNativeCurrency
      );

      if (prices) {
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

      const newPayload = { assets: assetsWithBalance };

      if (!isEqual(lastUpdatePayload, newPayload)) {
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

export const optimismExplorerClearState = () => (
  dispatch: any,
  getState: any
) => {
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

export default (state = INITIAL_STATE, action: any) => {
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
