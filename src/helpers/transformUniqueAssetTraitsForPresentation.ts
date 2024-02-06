import { format, parse } from 'date-fns';
import { UniqueAssetTrait } from '../entities/uniqueAssets';

interface AdditionalProperties {
  color: string;
  slug: string;
}

type MappedTrait = UniqueAssetTrait & {
  originalValue: string | number | null | undefined;
  lowercase?: boolean;
  disableMenu?: boolean;
} & AdditionalProperties;

const poapDateRegex = /\d\d-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-\d\d\d\d/;
const poapDateFormatString = 'dd-MMM-y';
const targetDateFormatString = 'MMM do, y';

/**
 * Mapper function that converts various NFT trait values according to their
 * data type and other qualities. Like if it's a link it is shortening it.
 */
export default function transformUniqueAssetTraitsForPresentation(
  trait: UniqueAssetTrait,
  additionalProperties: AdditionalProperties
): MappedTrait {
  const { display_type, value } = trait;
  const mappedTrait: MappedTrait = {
    ...trait,
    ...additionalProperties,
    disableMenu: false,
    originalValue: value,
  };

  if (display_type === 'date') {
    // the value is in seconds with milliseconds in the decimal part
    // formatted like Jan 29th, 2022
    mappedTrait.value = typeof value === 'number' ? format(value * 1000, targetDateFormatString) : value;
    mappedTrait.disableMenu = true;
    // Checking whether the string value is a POAP date format to convert to our date format
  } else if (typeof value === 'string' && poapDateRegex.test(value)) {
    const poapDate = parse(value, poapDateFormatString, new Date());

    mappedTrait.value = format(poapDate, targetDateFormatString);
  } else if (display_type === 'boost_percentage') {
    mappedTrait.value = `+${value}%`;
  } else if (display_type === 'boost_number') {
    mappedTrait.value = `+${value}`;
  } else if (typeof value === 'string' && value.toLowerCase().startsWith('https://')) {
    mappedTrait.value = value.toLowerCase().replace('https://', '');
    mappedTrait.lowercase = true;
  }

  return mappedTrait;
}
