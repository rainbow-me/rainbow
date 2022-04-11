import React, { useMemo } from 'react';
import { sortList } from '../../helpers/sortList';
import { magicMemo } from '../../utils';
import Tag from './Tag';
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
  const sortedTraits = useMemo(
    () =>
      (sortList(traits, 'trait_type', 'asc') as typeof traits)
        .filter(trait => trait.value && trait.trait_type)
        .sort(uniqueAssetTraitDisplayTypeCompareFunction)
        .map(transformUniqueAssetTraitsForPresentation)
        .map(trait => ({
          ...trait,
          color,
          disableInteraction: disableMenu || trait.disableMenu,
          slug,
        })),
    [traits, color, disableMenu, slug]
  );

  return (
    <Inline space="10px">
      {sortedTraits.map(
        ({
          color,
          disableMenu,
          lowercase,
          value,
          originalValue,
          trait_type: type,
          max_value: maxValue,
        }) => (
          <Tag
            color={color}
            disableMenu={disableMenu}
            key={`${type}${originalValue}`}
            lowercase={lowercase}
            maxValue={maxValue}
            originalValue={originalValue}
            slug={slug}
            text={value}
            title={type}
          />
        )
      )}
    </Inline>
  );
};

export default magicMemo(UniqueTokenAttributes, ['color', 'slug', 'traits']);
