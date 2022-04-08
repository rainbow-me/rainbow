import { format } from 'date-fns';
import { UniqueAssetTrait } from '../entities/uniqueAssets';

type MappedTrait = UniqueAssetTrait & {
  originalValue: string | number | null | undefined;
  lowercase?: boolean;
  disableMenu?: boolean;
};

/**
 * Mapper function that converts various NFT trait values according to their
 * data type and other qualities. Like if it's a link it is shortening it.
 */
export default function transformUniqueAssetTraitsForPresentation(
  trait: UniqueAssetTrait
): MappedTrait {
  const { display_type, value } = trait;
  const mappedTrait: MappedTrait = { ...trait, originalValue: value };

  if (display_type === 'date') {
    // the value is in seconds with milliseconds in the decimal part
    // formatted like Jan 29th, 2022
    mappedTrait.value =
      typeof value === 'number' ? format(value * 1000, 'MMM do, y') : value;
    mappedTrait.disableMenu = true;
  } else if (display_type === 'boost_percentage') {
    mappedTrait.value = `+${value}%`;
  } else if (display_type === 'boost_number') {
    mappedTrait.value = `+${value}`;
  } else if (
    typeof value === 'string' &&
    value.toLowerCase().startsWith('https://')
  ) {
    mappedTrait.value = value.toLowerCase().replace('https://', '');
    mappedTrait.lowercase = true;
  } else if (
    typeof value === 'string' &&
    value.toLowerCase().startsWith('http://')
  ) {
    mappedTrait.value = value.toLowerCase().replace('http://', '');
    mappedTrait.lowercase = true;
  }

  return mappedTrait;
}
