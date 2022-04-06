import React from 'react';
import { sortList } from '../../helpers/sortList';
import { magicMemo } from '../../utils';
import UniqueTokenAttributeItem from './UniqueTokenAttributeItem';
import { Inline } from '@rainbow-me/design-system';
import { UniqueAsset } from '@rainbow-me/entities';
import transformUniqueAssetTraitsForPresentation from '@rainbow-me/helpers/transformUniqueAssetTraitsForPresentation';
import uniqueAssetTraitDisplayTypeCompareFunction from '@rainbow-me/helpers/uniqueAssetTraitDisplayTypeCompareFunction';

interface UniqueTokenAttributesProps {
  color: string;
  disableMenu?: boolean;
  slug: string;
  traits: UniqueAsset['traits'];
}

const UniqueTokenAttributes = ({
  color,
  disableMenu,
  slug,
  traits,
}: UniqueTokenAttributesProps) => {
  const sortedTraits = (sortList(traits, 'trait_type', 'asc') as typeof traits)
    .sort(uniqueAssetTraitDisplayTypeCompareFunction)
    .map(transformUniqueAssetTraitsForPresentation)
    .map(trait => ({
      ...trait,
      color,
      disableMenu,
      slug,
    }));

  return (
    <Inline space="10px">
      {sortedTraits.map(item => (
        <UniqueTokenAttributeItem
          key={`${item.trait_type}${item.value}`}
          {...item}
        />
      ))}
    </Inline>
  );
};

export default magicMemo(UniqueTokenAttributes, ['color', 'slug', 'traits']);
