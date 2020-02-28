import React from 'react';
import { COMPOUND_ACCOUNT_TOKEN_QUERY } from '../apollo/queries';
import { compoundClient } from '../apollo/client';
import { Text } from '../components/text';

const Example = () => {
  const address = '0x00000000af5a61acaf76190794e3fdf1289288a1';
  const cDaiAddress = '0xf5dce57282a584d2746faf1593d3121fcac444dc';
  const exchangeData = () => {
    let data = [];
    const userAddr = `${cDaiAddress}-${address}`;
    console.log('addr ', userAddr);
    const response = compoundClient.query({
      fetchPolicy: 'cache-first',
      query: COMPOUND_ACCOUNT_TOKEN_QUERY,
    });
    console.log('res ', response);
    if (!response.data) return;
    console.log('success!');

    return data;
  };

  const final = exchangeData();
  console.log('data dump ', final);

  return (
    <>
      <Text>Success!</Text>
    </>
  );
};

export default Example;
