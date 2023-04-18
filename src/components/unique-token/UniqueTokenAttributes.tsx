import React, { useMemo } from 'react';
import { sortList } from '../../helpers/sortList';
import { magicMemo } from '../../utils';
import Tag from './Tag';
import { Inline } from '@/design-system';
import isHttpUrl from '@/helpers/isHttpUrl';
import transformUniqueAssetTraitsForPresentation from '@/helpers/transformUniqueAssetTraitsForPresentation';
import uniqueAssetTraitDisplayTypeCompareFunction from '@/helpers/uniqueAssetTraitDisplayTypeCompareFunction';
import { NFTTrait } from '@/resources/nfts/types';

interface UniqueTokenAttributesProps {
  color: string;
  hideNftMarketplaceAction: boolean;
  marketplaceId?: string | null;
  marketplaceName?: string | null;
  slug: string;
  traits: NFTTrait[];
}

const UniqueTokenAttributes = ({
  color,
  hideNftMarketplaceAction,
  marketplaceId,
  marketplaceName,
  slug,
  traits,
}: UniqueTokenAttributesProps) => {
  const sortedTraits = useMemo(
    () =>
      sortList(traits, 'traitType', 'asc')
        .filter(trait => trait.value !== '' && !isHttpUrl(trait.value))
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
          traitType: type,
        }) => (
          <Tag
            color={color}
            disableMenu={disableMenu}
            hideNftMarketplaceAction={hideNftMarketplaceAction}
            key={`${type}${originalValue}`}
            lowercase={lowercase}
            marketplaceId={marketplaceId}
            marketplaceName={marketplaceName}
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
  'marketplaceId',
  'marketplaceName',
  'traits',
]);
