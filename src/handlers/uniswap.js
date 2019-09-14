import { getExecutionDetails, getTokenReserves } from '@uniswap/sdk';
import contractMap from 'eth-contract-metadata';
import { ethers } from 'ethers';
import {
  compact,
  get,
  keyBy,
  map,
  slice,
  toLower,
  zipObject,
} from 'lodash';
import {
  convertRawAmountToDecimalFormat,
  divide,
  fromWei,
  multiply,
} from '../helpers/utilities';
import { uniswapAssetAddresses } from '../references';
import { loadWallet } from '../model/wallet';
import exchangeABI from '../references/uniswap-exchange-abi.json';
import erc20ABI from '../references/erc20-abi.json';
import { promiseUtils } from '../utils';
import { toHex, web3Provider } from './web3';

const convertArgsForEthers = methodArguments =>
  methodArguments.map(arg =>
    typeof arg === 'object' ? ethers.utils.bigNumberify(arg.toFixed()) : arg
  );

const convertValueForEthers = value => {
  const valueBigNumber = ethers.utils.bigNumberify(value.toString());
  return ethers.utils.hexlify(valueBigNumber);
};

export const getReserve = tokenAddress => getTokenReserves(tokenAddress);

export const getReserves = async () => {
  const uniswapTokens = slice(uniswapAssetAddresses, 1);
  const reserves = await promiseUtils.PromiseAllWithFails(
    map(uniswapTokens, token => getTokenReserves(token))
  );
  return keyBy(compact(reserves), reserve => toLower(get(reserve, 'token.address')));
};

const getGasLimit = (exchange, methodName, updatedMethodArgs, value) => {
  switch (methodName) {
    case 'ethToTokenSwapInput':
      return exchange.estimate.ethToTokenSwapInput(...updatedMethodArgs, {
        value,
      });
    case 'ethToTokenSwapOutput':
      return exchange.estimate.ethToTokenSwapOutput(...updatedMethodArgs, {
        value,
      });
    case 'tokenToEthSwapInput':
      return exchange.estimate.tokenToEthSwapInput(...updatedMethodArgs, {
        value,
      });
    case 'tokenToEthSwapOutput':
      return exchange.estimate.tokenToEthSwapOutput(...updatedMethodArgs, {
        value,
      });
    case 'tokenToTokenSwapInput':
      return exchange.estimate.tokenToTokenSwapInput(...updatedMethodArgs, {
        value,
      });
    case 'tokenToTokenSwapOutput':
      return exchange.estimate.tokenToTokenSwapOutput(...updatedMethodArgs, {
        value,
      });
    default:
      return null;
  }
};

export const estimateSwapGasLimit = async tradeDetails => {
  const {
    exchange,
    methodName,
    updatedMethodArgs,
    value,
  } = getContractExecutionDetails(tradeDetails, web3Provider);
  try {
    const gasLimit = await getGasLimit(exchange, methodName, updatedMethodArgs, value);
    return gasLimit ? gasLimit.toString : null;
  } catch (error) {
    return null;
  }
};

export const getContractExecutionDetails = (tradeDetails, providerOrSigner) => {
  const executionDetails = getExecutionDetails(tradeDetails);
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

export const executeSwap = async (tradeDetails, gasLimit, gasPrice) => {
  const wallet = await loadWallet();
  if (!wallet) return null;
  const {
    exchange,
    methodName,
    updatedMethodArgs,
    value,
  } = getContractExecutionDetails(tradeDetails, wallet);
  const transactionParams = {
    gasLimit: gasLimit ? toHex(gasLimit) : undefined,
    gasPrice: gasPrice ? toHex(gasPrice) : undefined,
    value,
  };
  switch (methodName) {
  case 'ethToTokenSwapInput':
    return exchange.ethToTokenSwapInput(
      ...updatedMethodArgs,
      transactionParams,
    );
  case 'ethToTokenSwapOutput':
    return exchange.ethToTokenSwapOutput(
      ...updatedMethodArgs,
      transactionParams,
    );
  case 'tokenToEthSwapInput':
    return exchange.tokenToEthSwapInput(
      ...updatedMethodArgs,
      transactionParams,
    );
  case 'tokenToEthSwapOutput':
    return exchange.tokenToEthSwapOutput(
      ...updatedMethodArgs,
      transactionParams,
    );
  case 'tokenToTokenSwapInput':
    return exchange.tokenToTokenSwapInput(
      ...updatedMethodArgs,
      transactionParams,
    );
  case 'tokenToTokenSwapOutput':
    return exchange.tokenToTokenSwapOutput(
      ...updatedMethodArgs,
      transactionParams,
    );
  default:
    return null;
  }
};

export const getLiquidityInfo = async (accountAddress, exchangeContracts) => {
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
      const tokenReserveCall = tokenContract.balanceOf(exchangeAddress);
      const tokenDecimalsCall = tokenContract.decimals();

      const [reserve, decimals] = await Promise.all([
        tokenReserveCall,
        tokenDecimalsCall,
      ]);

      let name = '';
      try {
        name = await tokenContract.name().catch();
      } catch (error) {
        name = get(contractMap, `[${tokenAddress}].name`, '');
        if (!name) {
          console.log(
            'error getting name for token: ',
            tokenAddress,
            ' Error = ',
            error
          );
        }
      }

      let symbol = get(contractMap, `[${tokenAddress}].symbol`, '');
      try {
        symbol = await tokenContract.symbol().catch();
      } catch (error) {
        if (!symbol) {
          console.log(
            'error getting symbol for token: ',
            tokenAddress,
            ' Error = ',
            error
          );
        }
      }
      const ethBalance = fromWei(
        divide(multiply(ethReserve, balance), totalSupply)
      );
      const tokenBalance = convertRawAmountToDecimalFormat(
        divide(multiply(reserve, balance), totalSupply),
        decimals
      );

      return {
        balance,
        ethBalance,
        ethReserve,
        token: {
          balance: tokenBalance,
          decimals,
          name,
          symbol,
        },
        tokenAddress,
        totalSupply,
        uniqueId: `uniswap_${tokenAddress}`,
      };
    } catch (error) {
      console.log('error getting uniswap info', error);
      return {};
    }
  });

  const results = await Promise.all(promises);
  return zipObject(exchangeContracts, results);
};
