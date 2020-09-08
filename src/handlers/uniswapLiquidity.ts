import { Contract } from '@ethersproject/contracts';
import contractMap from 'eth-contract-metadata';
import { get, map, toLower, zipObject } from 'lodash';
import {
  convertRawAmountToDecimalFormat,
  divide,
  fromWei,
  multiply,
} from '../helpers/utilities';
import { erc20ABI, exchangeABI } from '../references';
import { web3Provider } from './web3';
import logger from 'logger';

// TODO JIN - v2 support, remove exchangeAddress usage
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
