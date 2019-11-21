import React, { useState, useEffect } from 'react';
import { COMPOUND_MARKET_QUERY, COMPOUND_ACCOUNT_TOKEN_QUERY } from '../apollo/queries';
import { useQuery, useApolloClient } from '@apollo/react-hooks';
import { Text } from '../components/text';
import { useSavingsAccount } from '../hooks';
import { client } from '../apollo/client';

/*
{
  accountCToken(id: "0xf5dce57282a584d2746faf1593d3121fcac444dc-0x00000000af5a61acaf76190794e3fdf1289288a1") {
    id
    lifetimeSupplyInterestAccrued => APR
    market {
      id
    }
  }
}

*/

const Example = () => {
  const address = "0x00000000af5a61acaf76190794e3fdf1289288a1";
  const cDaiAddress = "0xf5dce57282a584d2746faf1593d3121fcac444dc";
  const cUsdcAddress = "0x39aa39c021dfbae8fac545936693ac917d5e7563";
  const exchangeData = () => {
    let data = []
    const userAddr = `${cDaiAddress}-${address}`
    console.log('addr ', userAddr)
    const response = client.query({
      fetchPolicy: 'cache-first',
      query: COMPOUND_ACCOUNT_TOKEN_QUERY,
    });
    console.log('res ',  response)
    if (!response.data) return;
    console.log('success!')
    for(const market of response.data.markets) {
        if(exchangeAddress == market.id) {
            data.push(market);
        }
    }

    return data;
  }
  
  const final = exchangeData()
  console.log('data dump ', final)

  return (
    <>
      <Text>Success!</Text>
    </>
  );
};

export default Example;