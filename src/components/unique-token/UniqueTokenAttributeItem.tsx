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

const UniqueTokenAttributeItem = ({
  color,
  disableMenu,
  trait_type: type,
  slug,
  value,
  max_value: maxValue,
  lowercase,
  originalValue,
}: AttributeItemProps) => (
  <Tag
    color={color}
    disableMenu={disableMenu}
    lowercase={lowercase}
    maxValue={maxValue}
    originalValue={originalValue}
    slug={slug}
    text={value}
    title={type}
  />
);

export default magicMemo(UniqueTokenAttributeItem, ['slug', 'color', 'value']);
