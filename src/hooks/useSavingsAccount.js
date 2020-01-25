import { get, keyBy, property } from 'lodash';
import { useState, useEffect } from 'react';
import { gql, useQuery, useApolloClient } from '@apollo/client';
// import { client } from '../apollo/client';
import { COMPOUND_ACCOUNT, COMPOUND_MARKET_QUERY } from '../apollo/queries';
import { parseAssetName, parseAssetSymbol } from '../parsers/accounts';
import useAccountData from './useAccountData';

export default function useSavingsAccount() {
  const [compoundData, setCompoundData] = useState([]);
  // const client = useApolloClient();
  const accountData = useAccountData();
  console.log('accountData', accountData);
  const accountAddress = `"${accountData.accountAddress.toLowerCase()}"`;
  const query = gql`
    {
      account(id: ${accountAddress}) {
        id
        health
        tokens(first: 15) {
          borrowBalanceUnderlying
          cTokenBalance
          id
          lifetimeSupplyInterestAccrued
          supplyBalanceUnderlying
          symbol
          totalUnderlyingSupplied
        }
        totalBorrowValueInEth
        totalCollateralValueInEth
      }
    }
  `;
  const marketsQuery = useQuery(COMPOUND_MARKET_QUERY);
  const markets = keyBy(get(marketsQuery, 'data.markets', []), property('id'));
  const { data } = useQuery(query, { pollInterval: 2000 });
  const tokens = get(data, 'account.tokens', []).map(token => {
    const address = token.id.split('-')[0];
    const { name, symbol, ...marketData } = markets[address];

    return {
      ...token,
      ...marketData,
      cTokenAddress: address,
      name: parseAssetName(name, address, accountData.tokenOverrides),
      symbol: parseAssetSymbol(symbol, address, accountData.tokenOverrides),
    };
  });

  return tokens;
}


  // useEffect(() => {
  //   const fetchCompoundData = async function(exchangeAddresses) {
  //   try {

  //   // The argument exchangeAddresses is an array containing the tokens owned by current user
  //   // We  need to iterate over the list of exchangeAddresses and run a query for Market data from
  //   // each one and sae the data to be set using setCompoundData

  //   const exchangeData = exchangeAddresses.map(async addr => {
  //   const response = await client.query({
  //     query: COMPOUND_MARKET_QUERY,
  //     variables: {
  //       exchangeAddr: addr,
  //     },
  //   });

  //   if (!response.data) return;

  //   return response.data.markets;
  //   });
  //   } catch (error) {
  //   console.log('error: ', error);
  //   }
  //   }
  // });
