import { toChecksumAddress } from 'ethereumjs-util';
import { debounce, sortBy, uniqBy } from 'lodash';
import { ensClient } from '../apollo/client';
import { ENS_SUGGESTIONS } from '../apollo/queries';
import { removeFirstEmojiFromString } from '@rainbow-me/helpers/emojiHandler';
import { profileUtils } from '@rainbow-me/utils';

const fetchSuggestions = async (recipient, setSuggestions) => {
  console.log('fetch suggestions');
  if (recipient.length > 2) {
    const recpt = recipient.toLowerCase();
    let result = await ensClient.query({
      query: ENS_SUGGESTIONS,
      variables: {
        amount: 75,
        name: recpt,
      },
    });

    console.log('result from query: ', result?.data?.domains);

    if (result?.data?.domains.length) {
      const ENSSuggestions = result.data.domains
        .map(ensDomain => ({
          address:
            toChecksumAddress(ensDomain?.resolver?.addr?.id) || ensDomain.name,
          color: profileUtils.addressHashedColorIndex(
            ensDomain?.resolver?.addr?.id || ensDomain.name
          ),
          ens: true,
          network: 'mainnet',
          nickname: ensDomain.name,
        }))
        .filter(domain => !domain.nickname.includes('['));

      const sortedENSSuggestions = sortBy(
        ENSSuggestions,
        domain => domain.nickname.length,
        ['asc']
      );
      const slicedSortedSuggestions = sortedENSSuggestions.slice(0, 3);
      setSuggestions(slicedSortedSuggestions);
    }
  } else {
    setSuggestions([]);
  }
};

export const debouncedFetchSuggestions = debounce(fetchSuggestions, 200);
