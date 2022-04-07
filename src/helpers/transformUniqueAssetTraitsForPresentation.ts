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

  if (display_type === 'date') {
    // the value is in seconds with milliseconds in the decimal part
    // formatted like Jan 29th, 2022
    const newValue =
      typeof value === 'number' ? format(value * 1000, 'MMM do, y') : value;

    return {
      ...trait,
      disableMenu: true,
      originalValue: value,
      value: newValue,
    };
  }

  if (display_type === 'boost_percentage') {
    return { ...trait, originalValue: value, value: `+${value}%` };
  }

  if (display_type === 'boost_number') {
    return { ...trait, originalValue: value, value: `+${value}` };
  }

  if (typeof value === 'string' && value.toLowerCase().startsWith('https://')) {
    const newValue = value.toLowerCase().replace('https://', '');

    return {
      ...trait,
      lowercase: true,
      originalValue: value,
      value: newValue,
    };
  }

  return { ...trait, originalValue: value };
}
