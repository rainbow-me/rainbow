import { get } from 'lodash';
import { AssetTypes } from '@rainbow-me/entities';
import networkTypes from '@rainbow-me/helpers/networkTypes';

/**
 * @desc parse poaps
 * @param  {Object}
 * @return {Array}
 */

export const parsePoaps = data => {
  const poaps = get(data, 'data', null);
  //if (isNil(data)) throw new Error('Invalid data from OpenSea');
  return poaps.map(({ tokenId, event }) => {
    return {
      asset_contract: {
        address: '0x22c1f6050e56d2876009903609a2cc3fef83b415',
        name: 'POAPs',
        nft_version: '3.0',
        schema_name: 'ERC721',
        symbol: 'The Proof of Attendance Protocol',
        total_supply: null,
      },
      background: null,
      collection: {
        desctiption: 'The Proof of Attendance Protocol',
        external_url: 'https://poap.xyz/',
        image_url:
          'https://lh3.googleusercontent.com/FwLriCvKAMBBFHMxcjqvxjTlmROcDIabIFKRp87NS3u_QfSLxcNThgAzOJSbphgQqnyZ_v2fNgMZQkdCYHUliJwH-Q=s60',
        name: 'POAP',
        short_description: 'The Proof of Attendance Protocol',
      },
      description: event.description,
      external_link: event.event_url,
      familyImage:
        'https://lh3.googleusercontent.com/FwLriCvKAMBBFHMxcjqvxjTlmROcDIabIFKRp87NS3u_QfSLxcNThgAzOJSbphgQqnyZ_v2fNgMZQkdCYHUliJwH-Q=s60',
      familyName: 'POAP',

      id: tokenId,
      image_url: event.image_url,
      isSendable: false,
      lastPrice: null,
      name: event.name,
      network: networkTypes.xdai,
      permalink: event.event_url,
      traits: [
        {
          trait_type: 'country',
          value: event.country,
        },
        {
          trait_type: 'startDate',
          value: event.start_date,
        },
        {
          trait_type: 'endDate',
          value: event.start_date,
        },
        {
          trait_type: 'city',
          value: event.city,
        },
        {
          trait_type: 'eventURL',
          value: event.event_url,
        },
      ],
      type: AssetTypes.nft,
      uniqueId:
        event.name || `'0x22c1f6050e56d2876009903609a2cc3fef83b415'_${tokenId}`,
    };
  });
};
