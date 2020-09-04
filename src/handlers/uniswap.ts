import { BigNumber } from '@ethersproject/bignumber';
import { hexlify } from '@ethersproject/bytes';
import { Contract } from '@ethersproject/contracts';
import { captureException } from '@sentry/react-native';
import { Pair, Token, TokenAmount, Trade } from '@uniswap/sdk';
import {
  getExecutionDetails, // v1
} from '@uniswap/sdk1';
import { getUnixTime, sub } from 'date-fns';
import contractMap from 'eth-contract-metadata';
import {
  findKey,
  get,
  map,
  mapKeys,
  mapValues,
  toLower,
  zipObject,
} from 'lodash';
import { uniswapClient } from '../apollo/client';
import { UNISWAP_ALL_TOKENS, UNISWAP_CHART_QUERY } from '../apollo/queries';
import ChartTypes from '../helpers/chartTypes';
import {
  convertAmountToRawAmount,
  convertNumberToString,
  convertRawAmountToDecimalFormat,
  convertStringToNumber,
  divide,
  fromWei,
  multiply,
} from '../helpers/utilities';
import { loadWallet } from '../model/wallet';
import {
  erc20ABI,
  ethUnits,
  exchangeABI,
  uniswapTestnetAssets,
} from '../references';
import { toHex, web3Provider } from './web3';
import logger from 'logger';

const DefaultMaxSlippageInBips = 200;
const SlippageBufferInBips = 100;

export const getTestnetUniswapPairs = network => {
  const pairs = get(uniswapTestnetAssets, network, {});
  const loweredPairs = mapKeys(pairs, (_, key) => toLower(key));
  return mapValues(loweredPairs, value => ({
    ...value,
  }));
};

// TODO JIN
const convertArgsForEthers = methodArguments =>
  methodArguments.map(arg =>
    typeof arg === 'object' ? BigNumber.from(arg.toFixed()) : arg
  );

// TODO JIN
const convertValueForEthers = value => {
  const valueBigNumber = BigNumber.from(value.toString());
  return hexlify(valueBigNumber);
};

const getGasLimit = async (
  accountAddress,
  exchange,
  methodName,
  updatedMethodArgs,
  value
) => {
  const params = { from: accountAddress, value };
  switch (methodName) {
    case 'ethToTokenSwapInput':
      return exchange.estimate.ethToTokenSwapInput(
        ...updatedMethodArgs,
        params
      );
    case 'ethToTokenSwapOutput':
      return exchange.estimate.ethToTokenSwapOutput(
        ...updatedMethodArgs,
        params
      );
    case 'tokenToEthSwapInput':
      return exchange.estimate.tokenToEthSwapInput(
        ...updatedMethodArgs,
        params
      );
    case 'tokenToEthSwapOutput':
      return exchange.estimate.tokenToEthSwapOutput(
        ...updatedMethodArgs,
        params
      );
    case 'tokenToTokenSwapInput':
      return exchange.estimate.tokenToTokenSwapInput(
        ...updatedMethodArgs,
        params
      );
    case 'tokenToTokenSwapOutput':
      return exchange.estimate.tokenToTokenSwapOutput(
        ...updatedMethodArgs,
        params
      );
    default:
      return null;
  }
};

export const estimateSwapGasLimit = async (accountAddress, tradeDetails) => {
  try {
    const {
      exchange,
      methodName,
      updatedMethodArgs,
      value,
    } = getContractExecutionDetails(tradeDetails, web3Provider);
    const gasLimit = await getGasLimit(
      accountAddress,
      exchange,
      methodName,
      updatedMethodArgs,
      value
    );
    return gasLimit ? gasLimit.toString() : ethUnits.basic_swap;
  } catch (error) {
    logger.sentry('error executing estimateSwapGasLimit');
    captureException(error);
    return ethUnits.basic_swap;
  }
};

// TODO JIN
const getContractExecutionDetails = (tradeDetails, providerOrSigner) => {
  const slippage = convertStringToNumber(
    get(tradeDetails, 'executionRateSlippage', 0)
  );
  const maxSlippage = Math.max(
    slippage + SlippageBufferInBips,
    DefaultMaxSlippageInBips
  );
  const executionDetails = getExecutionDetails(tradeDetails, maxSlippage);
  const {
    exchangeAddress,
    methodArguments,
    methodName,
    value: rawValue,
  } = executionDetails;
  const exchange = new Contract(exchangeAddress, exchangeABI, providerOrSigner);
  const updatedMethodArgs = convertArgsForEthers(methodArguments);
  const value = convertValueForEthers(rawValue);
  return {
    exchange,
    methodName,
    updatedMethodArgs,
    value,
  };
};

export const executeSwap = async (
  tradeDetails,
  gasLimit,
  gasPrice,
  wallet = null
) => {
  const walletToUse = wallet || (await loadWallet());
  if (!walletToUse) return null;
  const {
    exchange,
    methodName,
    updatedMethodArgs,
    value,
  } = getContractExecutionDetails(tradeDetails, walletToUse);
  const transactionParams = {
    gasLimit: gasLimit ? toHex(gasLimit) : undefined,
    gasPrice: gasPrice ? toHex(gasPrice) : undefined,
    value,
  };

  switch (methodName) {
    case 'ethToTokenSwapInput':
      return exchange.ethToTokenSwapInput(
        ...updatedMethodArgs,
        transactionParams
      );
    case 'ethToTokenSwapOutput':
      return exchange.ethToTokenSwapOutput(
        ...updatedMethodArgs,
        transactionParams
      );
    case 'tokenToEthSwapInput':
      return exchange.tokenToEthSwapInput(
        ...updatedMethodArgs,
        transactionParams
      );
    case 'tokenToEthSwapOutput':
      return exchange.tokenToEthSwapOutput(
        ...updatedMethodArgs,
        transactionParams
      );
    case 'tokenToTokenSwapInput':
      return exchange.tokenToTokenSwapInput(
        ...updatedMethodArgs,
        transactionParams
      );
    case 'tokenToTokenSwapOutput':
      return exchange.tokenToTokenSwapOutput(
        ...updatedMethodArgs,
        transactionParams
      );
    default:
      return null;
  }
};

// TODO JIN
export const getLiquidityInfo = async (
  accountAddress,
  exchangeContracts,
  pairs
) => {
  const promises = map(exchangeContracts, async exchangeAddress => {
    try {
      const ethReserveCall = web3Provider.getBalance(exchangeAddress);
      const exchange = new Contract(exchangeAddress, exchangeABI, web3Provider);
      const tokenAddressCall = exchange.tokenAddress();
      const balanceCall = exchange.balanceOf(accountAddress);
      const totalSupplyCall = exchange.totalSupply();

      const [
        ethReserve,
        tokenAddress,
        balance,
        totalSupply,
      ] = await Promise.all([
        ethReserveCall,
        tokenAddressCall,
        balanceCall,
        totalSupplyCall,
      ]);

      const tokenContract = new Contract(tokenAddress, erc20ABI, web3Provider);

      const token = get(pairs, `[${toLower(tokenAddress)}]`);

      let decimals = '';
      let name = '';
      let symbol = '';

      if (token) {
        name = token.name;
        symbol = token.symbol;
        decimals = token.decimals;
      } else {
        decimals = get(contractMap, `[${tokenAddress}].decimals`, '');
        if (!decimals) {
          try {
            decimals = await tokenContract.decimals().catch();
          } catch (error) {
            decimals = 18;
            logger.log(
              'error getting decimals for token: ',
              tokenAddress,
              ' Error = ',
              error
            );
          }
        }

        name = get(contractMap, `[${tokenAddress}].name`, '');
        if (!name) {
          try {
            name = await tokenContract.name().catch();
          } catch (error) {
            logger.log(
              'error getting name for token: ',
              tokenAddress,
              ' Error = ',
              error
            );
          }
        }

        symbol = get(contractMap, `[${tokenAddress}].symbol`, '');
        if (!symbol) {
          try {
            symbol = await tokenContract.symbol().catch();
          } catch (error) {
            logger.log(
              'error getting symbol for token: ',
              tokenAddress,
              ' Error = ',
              error
            );
          }
        }
      }

      const reserve = await tokenContract.balanceOf(exchangeAddress);

      const ethBalance = fromWei(
        divide(multiply(ethReserve, balance), totalSupply)
      );
      const tokenBalance = convertRawAmountToDecimalFormat(
        divide(multiply(reserve, balance), totalSupply),
        decimals
      );

      return {
        balance: convertRawAmountToDecimalFormat(balance),
        ethBalance,
        ethReserve,
        token: {
          balance: tokenBalance,
          decimals,
          name,
          symbol,
        },
        tokenAddress,
        totalSupply: convertRawAmountToDecimalFormat(totalSupply),
        uniqueId: `uniswap_${tokenAddress}`,
      };
    } catch (error) {
      logger.log('error getting uniswap info', error);
      return {};
    }
  });

  const results = await Promise.all(promises);
  return zipObject(exchangeContracts, results);
};

export const getChart = async (exchangeAddress, timeframe) => {
  const now = new Date();
  const timeframeKey = findKey(ChartTypes, type => type === timeframe);
  let startTime = getUnixTime(
    sub(now, {
      ...(timeframe === ChartTypes.max
        ? { years: 2 }
        : { [`${timeframeKey}s`]: 1 }),
      seconds: 1, // -1 seconds because we filter on greater than in the query
    })
  );

  let data = [];
  try {
    let dataEnd = false;
    while (!dataEnd) {
      const chartData = await uniswapClient
        .query({
          fetchPolicy: 'cache-first',
          query: UNISWAP_CHART_QUERY,
          variables: {
            date: startTime,
            exchangeAddress,
          },
        })
        .then(({ data: { exchangeDayDatas } }) =>
          exchangeDayDatas.map(({ date, tokenPriceUSD }) => [
            date,
            parseFloat(tokenPriceUSD),
          ])
        );

      data = data.concat(chartData);

      if (chartData.length !== 100) {
        dataEnd = true;
      } else {
        startTime = chartData[chartData.length - 1][0];
      }
    }
  } catch (err) {
    logger.log('error: ', err);
  }

  return data;
};

export const getAllTokens = async (tokenOverrides, excluded = []) => {
  const pageSize = 600;
  let allTokens = {};
  let data = [];
  try {
    let dataEnd = false;
    let skip = 0;
    while (!dataEnd) {
      let result = await uniswapClient.query({
        query: UNISWAP_ALL_TOKENS,
        variables: {
          excluded,
          first: pageSize,
          skip: skip,
        },
      });
      data = data.concat(result.data.tokens);
      skip = skip + pageSize;
      if (result.data.tokens.length < pageSize) {
        dataEnd = true;
      }
    }
  } catch (err) {
    logger.log('error: ', err);
  }
  data.forEach(token => {
    const tokenAddress = toLower(token.id);
    const tokenInfo = {
      address: token.id,
      decimals: token.decimals,
      name: token.name,
      symbol: token.symbol,
      totalLiquidity: token.totalLiquidity,
      ...tokenOverrides[tokenAddress],
    };
    allTokens[tokenAddress] = tokenInfo;
  });
  return allTokens;
};

export const calculateTradeDetails = (
  inputAmount: number,
  outputAmount: number,
  inputToken: Token,
  outputToken: Token,
  pairs: Record<string, Pair>,
  exactInput: boolean
): Trade | null => {
  if (!inputToken || !outputToken) {
    return null;
  }
  if (exactInput) {
    const inputRawAmount = convertAmountToRawAmount(
      convertNumberToString(inputAmount || 0),
      inputToken.decimals
    );

    const amountIn = new TokenAmount(inputToken, inputRawAmount);
    return Trade.bestTradeExactIn(Object.values(pairs), amountIn, outputToken, {
      maxNumResults: 1,
    })[0];
  } else {
    const outputRawAmount = convertAmountToRawAmount(
      convertNumberToString(outputAmount || 0),
      outputToken.decimals
    );
    const amountOut = new TokenAmount(outputToken, outputRawAmount);
    return Trade.bestTradeExactOut(
      Object.values(pairs),
      inputToken,
      amountOut,
      {
        maxNumResults: 1,
      }
    )[0];
  }
};
