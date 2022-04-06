import { format } from 'date-fns';
import { UniqueAsset } from '@rainbow-me/entities';

export default function transformUniqueAssetTraitsForPresentation(
  trait: UniqueAsset['traits'][number]
): UniqueAsset['traits'][number] {
  const { display_type, value } = trait;

  if (display_type === 'date') {
    // the value is in seconds, formatted like Jan 29th, 2022
    const newValue =
      typeof value === 'number' ? format(value * 1000, 'MMM do, y') : value;

    return { ...trait, value: newValue };
  }

  if (display_type === 'boost_percentage') {
    return { ...trait, value: `+${value}%` };
  }

  if (display_type === 'boost_number') {
    return { ...trait, value: `+${value}` };
  }

  if (
    typeof value === 'string' &&
    value.toLocaleLowerCase().startsWith('https://')
  ) {
    const newValue = value.toLowerCase().replace('https://', '');

    return { ...trait, value: newValue };
  }

  return trait;
}
