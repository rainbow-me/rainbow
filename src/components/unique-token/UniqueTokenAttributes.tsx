import React, { useMemo } from 'react';
import { sortList } from '../../helpers/sortList';
import { magicMemo } from '../../utils';
import Tag from './Tag';
import { Inline } from '@/design-system';
import { UniqueAsset } from '@/entities';
import isHttpUrl from '@/helpers/isHttpUrl';
import transformUniqueAssetTraitsForPresentation from '@/helpers/transformUniqueAssetTraitsForPresentation';
import uniqueAssetTraitDisplayTypeCompareFunction from '@/helpers/uniqueAssetTraitDisplayTypeCompareFunction';

interface UniqueTokenAttributesProps {
  color: string;
  hideNftMarketplaceAction: boolean;
  marketplaceName?: string | null;
  slug: string;
  traits: UniqueAsset['traits'];
}

const UniqueTokenAttributes = ({
  color,
  hideNftMarketplaceAction,
  marketplaceName,
  slug,
  traits,
}: UniqueTokenAttributesProps) => {
  const sortedTraits = useMemo(
    () =>
      (sortList(traits, 'trait_type', 'asc') as typeof traits)
        .filter(
          trait =>
            trait.value !== undefined &&
            trait.value !== null &&
            trait.value !== '' &&
            trait.trait_type &&
            !isHttpUrl(trait.value)
        )
        .sort(uniqueAssetTraitDisplayTypeCompareFunction)
        .map(trait => {
          return transformUniqueAssetTraitsForPresentation(trait, {
            color,
            slug,
          });
        }),
    [traits, color, slug]
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
            hideNftMarketplaceAction={hideNftMarketplaceAction}
            key={`${type}${originalValue}`}
            lowercase={lowercase}
            marketplaceName={marketplaceName}
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

export default magicMemo(UniqueTokenAttributes, [
  'color',
  'slug',
  'marketplaceName',
  'traits',
]);
