import React from 'react';
import { UniqueAssetTrait } from '../../entities/uniqueAssets';
import Tag from '../Tag';
import transformUniqueAssetTraitsForPresentation from '@rainbow-me/helpers/transformUniqueAssetTraitsForPresentation';
import { magicMemo } from '@rainbow-me/utils';

type AttributeItemProps = UniqueAssetTrait &
  ReturnType<typeof transformUniqueAssetTraitsForPresentation> & {
    color: string;
    slug: string;
    max_value?: string | number;
  };

const UniqueTokenAttributeItem: React.FC<AttributeItemProps> = ({
  color,
  disableMenu,
  trait_type: type,
  slug,
  value,
  max_value: maxValue,
  keepLowerCase,
  originalValue,
}) => {
  if (!type || !value) {
    return null;
  }

  return (
    <Tag
      color={color}
      disableMenu={disableMenu}
      keepTextLowerCase={keepLowerCase}
      maxValue={maxValue}
      slug={slug}
      text={value}
      title={type}
      value={originalValue}
    />
  );
};

export default magicMemo(UniqueTokenAttributeItem, ['slug', 'color', 'value']);
