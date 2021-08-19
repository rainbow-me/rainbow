import { toChecksumAddress } from 'ethereumjs-util';
import { debounce, sortBy, uniqBy } from 'lodash';
import { ensClient } from '../apollo/client';
import { ENS_SUGGESTIONS } from '../apollo/queries';
import { removeFirstEmojiFromString } from '@rainbow-me/helpers/emojiHandler';
import { profileUtils } from '@rainbow-me/utils';

const fetchSuggestions = async (recipient, setSuggestions, watchedAccounts) => {
  console.log('fetch suggestions');
  if (recipient?.length) {
    recipient = recipient.toLowerCase();
    const watchedSuggestions = watchedAccounts
      .map(account => ({
        address: account.address,
        color: profileUtils.addressHashedColorIndex(
          account.address || account.label
        ),
        ens: true,
        network: 'mainnet',
        nickname: removeFirstEmojiFromString(account.label),
      }))
      .filter(account => account.nickname.includes(recipient));

    const sortedWatchSuggestions = sortBy(
      watchedSuggestions,
      domain => domain.nickname.length,
      ['asc']
    );

    let sortedSuggestions = sortedWatchSuggestions;

    if (recipient.length > 2) {
      let result = await ensClient.query({
        query: ENS_SUGGESTIONS,
        variables: {
          amount: 75,
          name: recipient,
        },
      });

      if (result?.data?.domains.length) {
        const ENSSuggestions = result.data.domains
          .map(ensDomain => ({
            address:
              toChecksumAddress(ensDomain?.resolver?.addr?.id) ||
              ensDomain.name,
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

        sortedSuggestions = uniqBy(
          [...sortedSuggestions, ...sortedENSSuggestions],
          suggestion => suggestion.address
        );
      }
    }
    sortedSuggestions = sortedSuggestions.slice(0, 3);
    setSuggestions(sortedSuggestions);
  } else {
    setSuggestions([]);
  }
};

export const debouncedFetchSuggestions = debounce(fetchSuggestions, 200);
