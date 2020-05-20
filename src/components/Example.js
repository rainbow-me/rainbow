import React from 'react';
import { compoundClient } from '../apollo/client';
import { COMPOUND_ACCOUNT_TOKEN_QUERY } from '../apollo/queries';
import { Text } from '../components/text';
import { logger } from '../utils';

const Example = () => {
  const address = '0x00000000af5a61acaf76190794e3fdf1289288a1';
  const cDaiAddress = '0xf5dce57282a584d2746faf1593d3121fcac444dc';
  const exchangeData = () => {
    let data = [];
    const userAddr = `${cDaiAddress}-${address}`;
    logger.log('addr ', userAddr);
    const response = compoundClient.query({
      fetchPolicy: 'cache-first',
      query: COMPOUND_ACCOUNT_TOKEN_QUERY,
    });
    logger.log('res ', response);
    if (!response.data) return;
    logger.log('success!');

    return data;
  };

  const final = exchangeData();
  logger.log('data dump ', final);

  return (
    <>
      <Text>Success!</Text>
    </>
  );
};

export default Example;
