import { get, keyBy, orderBy, property, toLower } from 'lodash';
import { compoundClient } from '../apollo/client';
import { COMPOUND_ACCOUNT_AND_MARKET_QUERY } from '../apollo/queries';
import { getSavings, saveSavings } from '../handlers/localstorage/accountLocal';
import assetTypes from '../helpers/assetTypes';
import { multiply } from '../helpers/utilities';
import { parseAssetName, parseAssetSymbol } from '../parsers/accounts';
import { CDAI_CONTRACT } from '../references';

// -- Constants --------------------------------------- //
const COMPOUND_QUERY_INTERVAL = 120000;
const SAVINGS_UPDATE_COMPOUND_DATA = 'savings/SAVINGS_UPDATE_COMPOUND_DATA';
const SAVINGS_UPDATE_COMPOUND_SUBSCRIPTION =
  'savings/SAVINGS_UPDATE_COMPOUND_SUBSCRIPTION';
const SAVINGS_CLEAR_STATE = 'savings/SAVINGS_CLEAR_STATE';
const SAVINGS_SET_NUMBER_OF_JUST_FINISHED_DEPOSITS_OR_WITHDRAWAL =
  'savings/SAVINGS_SET_NUMBER_OF_JUST_FINISHED_DEPOSITS_OR_WITHDRAWAL';

const getMarketData = marketData => {
  const underlying = getUnderlyingData(marketData);
  const cToken = getCTokenData(marketData);
  const { exchangeRate, supplyRate, underlyingPrice } = marketData;

  return {
    cToken,
    exchangeRate,
    supplyRate,
    underlying,
    underlyingPrice,
  };
};

const getCTokenData = marketData => {
  const { id: cTokenAddress, name, symbol } = marketData;

  return {
    address: cTokenAddress,
    decimals: 8,
    name: parseAssetName(name, cTokenAddress),
    symbol: parseAssetSymbol(symbol, cTokenAddress),
  };
};

const getUnderlyingData = marketData => {
  const {
    underlyingAddress,
    underlyingDecimals,
    underlyingName,
    underlyingSymbol,
  } = marketData;

  return {
    address: underlyingAddress,
    decimals: underlyingDecimals,
    name: parseAssetName(underlyingName, underlyingAddress),
    symbol: parseAssetSymbol(underlyingSymbol, underlyingAddress),
  };
};

// -- Actions ---------------------------------------- //
export const savingsLoadState = () => async (dispatch, getState) => {
  try {
    subscribeToCompoundData(dispatch, getState);
    // eslint-disable-next-line no-empty
  } catch (error) {}
};

export const savingsClearState = () => (dispatch, getState) => {
  const { savingsSubscription } = getState().savings;
  savingsSubscription &&
    savingsSubscription.unsubscribe &&
    savingsSubscription.unsubscribe();
  dispatch({ type: SAVINGS_CLEAR_STATE });
};

export const savingsIncrementNumberOfJustFinishedDepositsOrWithdrawals = () => (
  dispatch,
  getState
) => {
  const {
    numberOfJustFinishedDepositsOrWithdrawals,
    savingsQuery,
  } = getState().savings;
  if (numberOfJustFinishedDepositsOrWithdrawals === 0) {
    savingsQuery.setOptions({ pollInterval: 10000 });
  }
  dispatch({
    payload: {
      numberOfJustFinishedDepositsOrWithdrawals:
        numberOfJustFinishedDepositsOrWithdrawals + 1,
    },
    type: SAVINGS_SET_NUMBER_OF_JUST_FINISHED_DEPOSITS_OR_WITHDRAWAL,
  });
};

export const savingsDecrementNumberOfJustFinishedDepositsOrWithdrawals = () => (
  dispatch,
  getState
) => {
  const {
    numberOfJustFinishedDepositsOrWithdrawals,
    savingsQuery,
  } = getState().savings;
  if (numberOfJustFinishedDepositsOrWithdrawals === 1) {
    savingsQuery.setOptions({ pollInterval: COMPOUND_QUERY_INTERVAL });
  }
  dispatch({
    payload: {
      numberOfJustFinishedDepositsOrWithdrawals:
        numberOfJustFinishedDepositsOrWithdrawals - 1,
    },
    type: SAVINGS_SET_NUMBER_OF_JUST_FINISHED_DEPOSITS_OR_WITHDRAWAL,
  });
};

const subscribeToCompoundData = async (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  const { savingsQuery } = getState().savings;
  let shouldRefetch = true;
  if (savingsQuery) {
    if (
      toLower(get(savingsQuery, 'variables.id', '')) !== toLower(accountAddress)
    ) {
      shouldRefetch = false;
    }
  }

  if (savingsQuery && shouldRefetch) {
    savingsQuery.resetLastResults();
    savingsQuery.refetch();
  } else {
    if (savingsQuery) {
      const { savingsSubscription } = getState().savings;
      savingsSubscription &&
        savingsSubscription.unsubscribe &&
        savingsSubscription.unsubscribe();
    }
    // First read from localstorage
    let savingsAccountLocal = accountAddress
      ? await getSavings(accountAddress, network)
      : [];

    const newQuery = compoundClient.watchQuery({
      fetchPolicy: 'network-only',
      pollInterval: COMPOUND_QUERY_INTERVAL, // 120 seconds
      query: COMPOUND_ACCOUNT_AND_MARKET_QUERY,
      skip: !toLower(accountAddress),
      variables: { id: toLower(accountAddress) },
    });

    const newSubscription = newQuery.subscribe({
      next: async ({ data }) => {
        let savingsAccountData = [];
        const markets = keyBy(get(data, 'markets', []), property('id'));

        let accountTokens = get(data, 'account.tokens', []);

        accountTokens = accountTokens.map(token => {
          const [cTokenAddress] = token.id.split('-');
          const marketData = markets[cTokenAddress] || {};

          const {
            cToken,
            exchangeRate,
            supplyRate,
            underlying,
            underlyingPrice,
          } = getMarketData(marketData);

          const ethPrice = multiply(
            underlyingPrice,
            token.supplyBalanceUnderlying
          );

          const {
            cTokenBalance,
            lifetimeSupplyInterestAccrued,
            supplyBalanceUnderlying,
          } = token;

          return {
            cToken,
            cTokenBalance,
            ethPrice,
            exchangeRate,
            lifetimeSupplyInterestAccrued,
            supplyBalanceUnderlying,
            supplyRate,
            type: assetTypes.cToken,
            underlying,
            underlyingPrice,
          };
        });

        accountTokens = orderBy(accountTokens, ['ethPrice'], ['desc']);
        if (accountTokens.length) {
          saveSavings(accountTokens, accountAddress, network);
          savingsAccountData = accountTokens;
        } else {
          savingsAccountData = savingsAccountLocal;
        }

        const daiMarketData = getMarketData(markets[CDAI_CONTRACT]);

        dispatch({
          payload: {
            accountTokens: savingsAccountData,
            daiMarketData: daiMarketData,
          },
          type: SAVINGS_UPDATE_COMPOUND_DATA,
        });
      },
    });
    dispatch({
      payload: {
        savingsQuery: newQuery,
        savingsSubscription: newSubscription,
      },
      type: SAVINGS_UPDATE_COMPOUND_SUBSCRIPTION,
    });
  }
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  accountTokens: [],
  daiMarketData: {},
  numberOfJustFinishedDepositsOrWithdrawals: 0,
  savingsQuery: null,
  savingsSubscription: null,
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case SAVINGS_UPDATE_COMPOUND_SUBSCRIPTION:
      return {
        ...state,
        savingsQuery: action.payload.savingsQuery,
        savingsSubscription: action.payload.savingsSubscription,
      };
    case SAVINGS_UPDATE_COMPOUND_DATA:
      return {
        ...state,
        accountTokens: action.payload.accountTokens,
        daiMarketData: action.payload.daiMarketData,
      };
    case SAVINGS_CLEAR_STATE:
      return {
        ...state,
        ...INITIAL_STATE,
      };
    case SAVINGS_SET_NUMBER_OF_JUST_FINISHED_DEPOSITS_OR_WITHDRAWAL:
      return {
        ...state,
        numberOfJustFinishedDepositsOrWithdrawals:
          action.payload.numberOfJustFinishedDepositsOrWithdrawals,
      };
    default:
      return state;
  }
};
