import { ethers } from 'ethers';
import { map, zipObject } from 'lodash';
import { divide, fromWei, multiply } from '../helpers/utilities';
import exchangeABI from '../references/uniswap-exchange-abi.json';
import erc20ABI from '../references/erc20-abi.json';
import { web3Provider } from './web3';

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

      let symbol = '';
      try {
        symbol = await tokenContract.symbol().catch();
      } catch (error) {
        console.log('error getting symbol', error);
      }

      const ethBalance = fromWei(divide(multiply(ethReserve, balance), totalSupply));
      const tokenBalance = fromWei(divide(multiply(reserve, balance), totalSupply), decimals);

      return {
        tokenAddress,
        balance,
        ethBalance,
        token: {
          balance: tokenBalance,
          decimals,
          symbol,
        },
        totalSupply,
      };
    } catch (error) {
      console.log('error getting uniswap info', error);
      return {};
    }
  });

  const results = await Promise.all(promises);
  return zipObject(exchangeContracts, results);
};
