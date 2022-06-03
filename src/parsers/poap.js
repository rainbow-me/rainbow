import { get } from 'lodash';
import { AssetTypes } from '@rainbow-me/entities';
import { imageToPng } from '@rainbow-me/handlers/imgix';
/**
 * @desc parse poaps
 * @param  {Object}
 * @return {Array}
 */

export const parsePoaps = data => {
  const poaps = get(data, 'data', null);
  return poaps.map(({ event }) => {
    return {
      animation_url: event.image_url,
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
      description: event?.description,
      external_link: event.event_url,
      familyImage:
        'https://lh3.googleusercontent.com/FwLriCvKAMBBFHMxcjqvxjTlmROcDIabIFKRp87NS3u_QfSLxcNThgAzOJSbphgQqnyZ_v2fNgMZQkdCYHUliJwH-Q=s60',
      familyName: 'POAP',
      id: event.id,
      image_original_url: event.image_url,
      image_url: imageToPng(event.image_url, 300),
      isPoap: true,
      isSendable: false,
      lastPrice: null,
      lastSalePaymentToken: null,
      lowResUrl: imageToPng(event.image_url, 300),
      name: event.name,
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
      uniqueId: `0x22c1f6050e56d2876009903609a2cc3fef83b415_${event.id}`,
    };
  });
};
