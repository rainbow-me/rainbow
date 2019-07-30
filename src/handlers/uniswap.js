import contractMap from 'eth-contract-metadata';
import { ethers } from 'ethers';
import { get, map, zipObject } from 'lodash';
import {
  convertRawAmountToDecimalFormat,
  divide,
  fromWei,
  multiply,
} from '../helpers/utilities';
import exchangeABI from '../references/uniswap-exchange-abi.json';
import erc20ABI from '../references/erc20-abi.json';
import { web3Provider } from './web3';

export default async function getUniswapLiquidityInfo(accountAddress, exchangeContracts) {
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
}
