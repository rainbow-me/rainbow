import { getExecutionDetails, getTokenReserves } from '@uniswap/sdk';
import contractMap from 'eth-contract-metadata';
import { ethers } from 'ethers';
import { compact, get, keyBy, map, slice, zipObject } from 'lodash';
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
import { web3Provider } from './web3';

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
  return keyBy(compact(reserves), reserve => {
    const address = get(reserve, 'token.address') || '';
    return address.toLowerCase();
  });
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

export const estimateSwapGasLimit = tradeDetails => {
  const {
    exchange,
    methodName,
    updatedMethodArgs,
    value,
  } = getContractExecutionDetails(tradeDetails, web3Provider);
  return getGasLimit(exchange, methodName, updatedMethodArgs, value);
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

export const executeSwap = async (tradeDetails, gasLimit) => {
  const wallet = await loadWallet();
  if (!wallet) return null;
  const {
    exchange,
    methodName,
    updatedMethodArgs,
    value,
  } = getContractExecutionDetails(tradeDetails, wallet);
  switch (methodName) {
    case 'ethToTokenSwapInput':
      return exchange.ethToTokenSwapInput(...updatedMethodArgs, {
        gasLimit,
        value,
      });
    case 'ethToTokenSwapOutput':
      return exchange.ethToTokenSwapOutput(...updatedMethodArgs, {
        gasLimit,
        value,
      });
    case 'tokenToEthSwapInput': {
      // TODO approval check
      return exchange.tokenToEthSwapInput(...updatedMethodArgs, {
        gasLimit,
        value,
      });
    }
    case 'tokenToEthSwapOutput': {
      // TODO approval check
      return exchange.tokenToEthSwapOutput(...updatedMethodArgs, {
        gasLimit,
        value,
      });
    }
    case 'tokenToTokenSwapInput': {
      // TODO approval check
      return exchange.tokenToTokenSwapInput(...updatedMethodArgs, {
        gasLimit,
        value,
      });
    }
    case 'tokenToTokenSwapOutput': {
      // TODO approval check
      return exchange.tokenToTokenSwapOutput(...updatedMethodArgs, {
        gasLimit,
        value,
      });
    }
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
