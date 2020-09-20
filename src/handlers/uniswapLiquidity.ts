import { Contract } from '@ethersproject/contracts';
import contractMap from 'eth-contract-metadata';
import { get, map, toLower, zipObject } from 'lodash';
import {
  convertRawAmountToDecimalFormat,
  divide,
  fromWei,
  multiply,
} from '../helpers/utilities';
import { erc20ABI } from '../references';
import { UNISWAP_V1_EXCHANGE_ABI } from '../references/uniswap';
import { web3Provider } from './web3';
import logger from 'logger';

export const getLiquidityInfo = async (
  accountAddress,
  liquidityPoolContracts,
  pairs
) => {
  const promises = map(liquidityPoolContracts, async liquidityPoolAddress => {
    try {
      const ethReserveCall = web3Provider.getBalance(liquidityPoolAddress);
      const exchange = new Contract(
        liquidityPoolAddress,
        UNISWAP_V1_EXCHANGE_ABI,
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

      const reserve = await tokenContract.balanceOf(liquidityPoolAddress);

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
  return zipObject(liquidityPoolContracts, results);
};
