import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { SlackSheet } from '../components/sheet';
import { PREFS_ENDPOINT } from '../model/preferences';

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

async function fetchShowcaseForAddress(address) {
  const response = await axios({
    method: 'get',
    params: {
      address,
    },
    url: `${PREFS_ENDPOINT}/address`,
  });
  return response.data;
}

export default function ShowcaseScreen() {
  const someRandomAddress = '0x7a3d05c70581bd345fe117c06e45f9669205384f';
  // eslint-disable-next-line no-unused-vars
  const [userData, setUserData] = useState();
  // eslint-disable-next-line no-unused-vars
  const [nfts, setNfts] = useState();

  useEffect(() => {
    async function fetchNfts() {
      const nfts = await fetchNftsForAddress(someRandomAddress);
      setNfts(nfts);
    }
    fetchNfts();
  }, [someRandomAddress]);

  useEffect(() => {
    async function fetchShowcase() {
      const userData = await fetchShowcaseForAddress(someRandomAddress);
      setUserData(userData);
    }
    fetchShowcase();
  }, [someRandomAddress]);
  return <SlackSheet {...(ios && { height: '100%' })} />;
}
