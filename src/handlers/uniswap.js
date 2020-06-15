import {
  getExecutionDetails,
  getTokenReserves,
  tradeEthForExactTokensWithData,
  tradeExactEthForTokensWithData,
  tradeExactTokensForEthWithData,
  tradeExactTokensForTokensWithData,
  tradeTokensForExactEthWithData,
  tradeTokensForExactTokensWithData,
} from '@uniswap/sdk';
import { getUnixTime, sub } from 'date-fns';
import contractMap from 'eth-contract-metadata';
import { ethers } from 'ethers';
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
import {
  UNISWAP_ALL_EXCHANGES_QUERY,
  UNISWAP_CHART_QUERY,
} from '../apollo/queries';
import ChartTypes from '../helpers/chartTypes';
import {
  convertAmountToRawAmount,
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
import { logger } from '../utils';
import { toHex, web3Provider } from './web3';

const DefaultMaxSlippageInBips = 200;
const SlippageBufferInBips = 100;

export const getTestnetUniswapPairs = network => {
  const pairs = get(uniswapTestnetAssets, network, {});
  const loweredPairs = mapKeys(pairs, (_, key) => toLower(key));
  return mapValues(loweredPairs, value => ({
    ...value,
  }));
};

const convertArgsForEthers = methodArguments =>
  methodArguments.map(arg =>
    typeof arg === 'object' ? ethers.utils.bigNumberify(arg.toFixed()) : arg
  );

const convertValueForEthers = value => {
  const valueBigNumber = ethers.utils.bigNumberify(value.toString());
  return ethers.utils.hexlify(valueBigNumber);
};

export const getReserve = async tokenAddress =>
  !tokenAddress || tokenAddress === 'eth'
    ? Promise.resolve(null)
    : getTokenReserves(toLower(tokenAddress), web3Provider);

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
    return ethUnits.basic_swap;
  }
};

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
  const exchange = new ethers.Contract(
    exchangeAddress,
    exchangeABI,
    providerOrSigner
  );
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

export const getLiquidityInfo = async (
  accountAddress,
  exchangeContracts,
  pairs
) => {
  const promises = map(exchangeContracts, async exchangeAddress => {
    try {
      const ethReserveCall = web3Provider.getBalance(exchangeAddress);
      const exchange = new ethers.Contract(
        exchangeAddress,
        exchangeABI,
        web3Provider
      );
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

      const tokenContract = new ethers.Contract(
        tokenAddress,
        erc20ABI,
        web3Provider
      );

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

export const getAllExchanges = async (tokenOverrides, excluded = []) => {
  const pageSize = 600;
  let allTokens = {};
  let data = [];
  try {
    let dataEnd = false;
    let skip = 0;
    while (!dataEnd) {
      let result = await uniswapClient.query({
        query: UNISWAP_ALL_EXCHANGES_QUERY,
        variables: {
          excluded,
          first: pageSize,
          skip: skip,
        },
      });
      data = data.concat(result.data.exchanges);
      skip = skip + pageSize;
      if (result.data.exchanges.length < pageSize) {
        dataEnd = true;
      }
    }
  } catch (err) {
    logger.log('error: ', err);
  }
  data.forEach(exchange => {
    const tokenAddress = toLower(exchange.tokenAddress);
    const tokenExchangeInfo = {
      decimals: exchange.tokenDecimals,
      ethBalance: exchange.ethBalance,
      exchangeAddress: exchange.id,
      name: exchange.tokenName,
      symbol: exchange.tokenSymbol,
      ...tokenOverrides[tokenAddress],
    };
    allTokens[tokenAddress] = tokenExchangeInfo;
  });
  return allTokens;
};

export const calculateTradeDetails = (
  chainId,
  inputAmount,
  inputCurrency,
  inputReserve,
  outputAmount,
  outputCurrency,
  outputReserve,
  inputAsExactAmount
) => {
  const { address: inputAddress, decimals: inputDecimals } = inputCurrency;
  const { address: outputAddress, decimals: outputDecimals } = outputCurrency;

  const isInputEth = inputAddress === 'eth';
  const isOutputEth = outputAddress === 'eth';

  const rawInputAmount = convertAmountToRawAmount(
    inputAmount || 0,
    inputDecimals
  );

  const rawOutputAmount = convertAmountToRawAmount(
    outputAmount || 0,
    outputDecimals
  );

  let tradeDetails = null;

  if (isInputEth && !isOutputEth) {
    tradeDetails = inputAsExactAmount
      ? tradeExactEthForTokensWithData(outputReserve, rawInputAmount, chainId)
      : tradeEthForExactTokensWithData(outputReserve, rawOutputAmount, chainId);
  } else if (!isInputEth && isOutputEth) {
    tradeDetails = inputAsExactAmount
      ? tradeExactTokensForEthWithData(inputReserve, rawInputAmount, chainId)
      : tradeTokensForExactEthWithData(inputReserve, rawOutputAmount, chainId);
  } else if (!isInputEth && !isOutputEth) {
    tradeDetails = inputAsExactAmount
      ? tradeExactTokensForTokensWithData(
          inputReserve,
          outputReserve,
          rawInputAmount,
          chainId
        )
      : tradeTokensForExactTokensWithData(
          inputReserve,
          outputReserve,
          rawOutputAmount,
          chainId
        );
  }
  return tradeDetails;
};
