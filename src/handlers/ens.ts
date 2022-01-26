import { debounce, isEmpty, sortBy } from 'lodash';
import { ensClient } from '../apollo/client';
import {
  ENS_DOMAINS,
  ENS_REGISTRATIONS,
  ENS_SUGGESTIONS,
} from '../apollo/queries';
import { ParsedAddressAsset } from '@rainbow-me/entities';
import { convertAmountFromNativeValue } from '@rainbow-me/helpers/utilities';
import { profileUtils } from '@rainbow-me/utils';

export const fetchSuggestions = async (
  recipient: any,
  setSuggestions: any,
  setIsFetching = (_unused: any) => {}
) => {
  if (recipient.length > 2) {
    let suggestions = [];
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
        .map((ensDomain: any) => ({
          address: ensDomain?.resolver?.addr?.id || ensDomain?.name,

          color: profileUtils.addressHashedColorIndex(
            ensDomain?.resolver?.addr?.id || ensDomain.name
          ),

          ens: true,
          network: 'mainnet',
          nickname: ensDomain?.name,
          uniqueId: ensDomain?.resolver?.addr?.id || ensDomain.name,
        }))
        .filter((domain: any) => !domain?.nickname?.includes?.('['));
      const sortedEnsSuggestions = sortBy(
        ensSuggestions,
        domain => domain.nickname.length,
        ['asc']
      );

      suggestions = sortedEnsSuggestions.slice(0, 3);
    }

    setSuggestions(suggestions);
    setIsFetching(false);

    return suggestions;
  }
};

export const debouncedFetchSuggestions = debounce(fetchSuggestions, 200);

export const fetchRegistration = async (recipient: any) => {
  if (recipient.length > 2) {
    const recpt = recipient.toLowerCase();
    const result = await ensClient.query({
      query: ENS_DOMAINS,
      variables: {
        name: recpt,
      },
    });
    const labelHash = result?.data?.domains?.[0]?.labelhash;

    const registrations = await ensClient.query({
      query: ENS_REGISTRATIONS,
      variables: {
        labelHash,
      },
    });

    const { registrationDate, expiryDate } =
      registrations?.data?.registrations?.[0] || {};

    if (!isEmpty(registrations?.data?.registrations?.[0])) {
      return { expiryDate, isRegistered: true, registrationDate };
    } else {
      return {
        expiryDate: null,
        isRegistered: false,
        registrationDate: null,
      };
    }
  }
};
/**
 * Get USD and ETH cost of the registration of a given name during given years
 *
 * @param ethAsset ETH asset from general assets in state
 * @param name ENS name to get the cost
 * @param years Years of registration
 */
export const getENSCost = (
  ethAsset: ParsedAddressAsset,
  name: string,
  years: number
) => {
  //https://docs.ens.domains/frequently-asked-questions
  if (name.length < 3) return null;
  const priceUnit = ethAsset?.price?.value ?? 0;
  let usdAmount = 5;
  if (name.length === 4) {
    usdAmount = 160;
  } else if (name.length === 3) {
    usdAmount = 640;
  }
  const totalUSDAmount = usdAmount * years;
  const convertedAssetAmount = convertAmountFromNativeValue(
    totalUSDAmount,
    priceUnit,
    5
  );
  return { ETH: convertedAssetAmount, USD: totalUSDAmount };
};
