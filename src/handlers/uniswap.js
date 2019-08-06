import contractMap from 'eth-contract-metadata';
import { ethers } from 'ethers';
import { get, map, zipObject } from 'lodash';
import {
  convertRawAmountToDecimalFormat,
  divide,
  fromWei,
  multiply,
} from '../helpers/utilities';
import { loadWallet } from '../model/wallet';
import exchangeABI from '../references/uniswap-exchange-abi.json';
import erc20ABI from '../references/erc20-abi.json';
import { web3Provider } from './web3';

const convertArgsForEthers = (methodArguments) => methodArguments.map(arg => (typeof arg === 'object') ? ethers.utils.bigNumberify(arg.toFixed()) : arg);

const convertValueForEthers = (value) => {
  const valueBigNumber = ethers.utils.bigNumberify(value.toString());
  return ethers.utils.hexlify(valueBigNumber);
};

export const executeSwap = async (executionDetails) => {
  const wallet = await loadWallet();
  if (!wallet) return null;
  const {
    exchangeAddress,
    methodArguments,
    methodName,
    value: rawValue,
  } = executionDetails;
  const exchange = new ethers.Contract(exchangeAddress, exchangeABI, wallet);
  try {
    switch (methodName) {
    case 'ethToTokenSwapInput': {
      const updatedMethodArgs = convertArgsForEthers(methodArguments);
      const value = convertValueForEthers(rawValue);
      const gasLimit = await exchange.estimate.ethToTokenSwapInput(...updatedMethodArgs, { value });
      const txn = await exchange.ethToTokenSwapInput(...updatedMethodArgs, { gasLimit, value });
      // TODO add to new txn
      console.log('eth to token input', txn);
      return;
    }
    case 'ethToTokenSwapOutput': {
      const updatedMethodArgs = convertArgsForEthers(methodArguments);
      const value = convertValueForEthers(rawValue);
      const gasLimit = await exchange.estimate.ethToTokenSwapOutput(...updatedMethodArgs, { value });
      const txn = await exchange.ethToTokenSwapOutput(...updatedMethodArgs, { gasLimit, value });
      // TODO add to new txn
      console.log('eth to token output', txn);
      return;
    }
    case 'tokenToEthSwapInput': {
      const updatedMethodArgs = convertArgsForEthers(methodArguments);
      const value = convertValueForEthers(rawValue);
      const gasLimit = await exchange.estimate.tokenToEthSwapInput(...updatedMethodArgs, { value });
      const txn = await exchange.tokenToEthSwapInput(...updatedMethodArgs, { gasLimit, value });
      // TODO add to new txn
      console.log('token to eth input', txn);
      return;
    }
    case 'tokenToEthSwapOutput': {
      const updatedMethodArgs = convertArgsForEthers(methodArguments);
      const value = convertValueForEthers(rawValue);
      const gasLimit = await exchange.estimate.tokenToEthSwapOutput(...updatedMethodArgs, { value });
      const txn = await exchange.tokenToEthSwapOutput(...updatedMethodArgs, { gasLimit, value });
      // TODO add to new txn
      console.log('token to eth output', txn);
      return;
    }
    case 'tokenToTokenSwapInput': {
      const updatedMethodArgs = convertArgsForEthers(methodArguments);
      const value = convertValueForEthers(rawValue);
      const gasLimit = await exchange.estimate.tokenToTokenSwapInput(...updatedMethodArgs, { value });
      const txn = await exchange.tokenToTokenSwapInput(...updatedMethodArgs, { gasLimit, value });
      // TODO add to new txn
      console.log('token to token input', txn);
      return;
    }
    case 'tokenToTokenSwapOutput': {
      const updatedMethodArgs = convertArgsForEthers(methodArguments);
      const value = convertValueForEthers(rawValue);
      const gasLimit = await exchange.estimate.tokenToTokenSwapOutput(...updatedMethodArgs, { value });
      const txn = await exchange.tokenToTokenSwapOutput(...updatedMethodArgs, { gasLimit, value });
      // TODO add to new txn
      console.log('token to token output', txn);
      return;
    }
    default:
      return null;
    }
  } catch (error) {
    console.log('error exchanging', error);
  }
};

export const getUniswapLiquidityInfo = async (accountAddress, exchangeContracts) => {
  const promises = map(exchangeContracts, async (exchangeAddress) => {
    try {
      const ethReserveCall = web3Provider.getBalance(exchangeAddress);
      const exchange = new ethers.Contract(exchangeAddress, exchangeABI, web3Provider);
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

      const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, web3Provider);
      const tokenReserveCall = tokenContract.balanceOf(exchangeAddress);
      const tokenDecimalsCall = tokenContract.decimals();

      const [reserve, decimals] = await Promise.all([tokenReserveCall, tokenDecimalsCall]);

      let name = '';
      try {
        name = await tokenContract.name().catch();
      } catch (error) {
        name = get(contractMap, `[${tokenAddress}].name`, '');
        if (!name) {
          console.log('error getting name for token: ', tokenAddress, ' Error = ', error);
        }
      }

      let symbol = get(contractMap, `[${tokenAddress}].symbol`, '');
      try {
        symbol = await tokenContract.symbol().catch();
      } catch (error) {
        if (!symbol) {
          console.log('error getting symbol for token: ', tokenAddress, ' Error = ', error);
        }
      }
      const ethBalance = fromWei(divide(multiply(ethReserve, balance), totalSupply));
      const tokenBalance = convertRawAmountToDecimalFormat(divide(multiply(reserve, balance), totalSupply), decimals);

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
