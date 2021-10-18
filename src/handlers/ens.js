import { debounce, isEmpty, sortBy } from 'lodash';
import { ensClient } from '../apollo/client';
import { ENS_SUGGESTIONS } from '../apollo/queries';
import { profileUtils } from '@rainbow-me/utils';

export const fetchSuggestions = async (
  recipient,
  setSuggestions,
  // eslint-disable-next-line no-unused-vars
  setIsFetching = _unused => {}
) => {
  if (recipient.length > 2) {
    setIsFetching(true);
    const recpt = recipient.toLowerCase();
    let result = await ensClient.query({
      query: ENS_SUGGESTIONS,
      variables: {
        amount: 75,
        name: recpt,
      },
    });

    if (!isEmpty(result?.data?.domains)) {
      const ensSuggestions = result.data.domains
        .map(ensDomain => ({
          address: ensDomain?.resolver?.addr?.id || ensDomain?.name,
          color: profileUtils.addressHashedColorIndex(
            ensDomain?.resolver?.addr?.id || ensDomain.name
          ),
          ens: true,
          network: 'mainnet',
          nickname: ensDomain?.name,
          uniqueId: ensDomain?.resolver?.addr?.id || ensDomain.name,
        }))
        .filter(domain => !domain?.nickname?.includes?.('['));
      const sortedEnsSuggestions = sortBy(
        ensSuggestions,
        domain => domain.nickname.length,
        ['asc']
      );

      const slicedSortedSuggestions = sortedEnsSuggestions.slice(0, 3);
      setSuggestions(slicedSortedSuggestions);
    }
  } else {
    setSuggestions([]);
  }
  setIsFetching(false);
};

export const debouncedFetchSuggestions = debounce(fetchSuggestions, 200);
