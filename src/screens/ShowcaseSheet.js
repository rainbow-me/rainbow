import axios from 'axios';
import React, { useEffect } from 'react';
import { SlackSheet } from '../components/sheet';

const OPEN_SEA_ASSETS = 'https://api.opensea.io/api/v1/assets';
const LIMIT = 50;

async function fetchNftsForAddress(address) {
  let assets = [];
  let response;
  let offset = 0;
  while (!response || response?.data?.assets?.length === LIMIT) {
    response = await axios({
      method: 'get',
      params: {
        limit: LIMIT,
        offset,
        owner: address,
      },
      url: OPEN_SEA_ASSETS,
    });
    offset += LIMIT;
    assets = assets.concat(response.data.assets);
  }
  return assets;
}
export default function ShowcaseScreen() {
  const someRandomAddress = '0x11e4857bb9993a50c685a79afad4e6f65d518dda';

  useEffect(() => {
    async function fetchNfts() {
      await fetchNftsForAddress(someRandomAddress);
    }
    fetchNfts();
  }, [someRandomAddress]);
  return <SlackSheet {...(ios && { height: '100%' })} />;
}
