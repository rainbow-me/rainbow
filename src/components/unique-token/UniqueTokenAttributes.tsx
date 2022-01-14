import React from 'react';
import { sortList } from '../../helpers/sortList';
import { magicMemo } from '../../utils';
import Tag from '../Tag';
import { Inline } from '@rainbow-me/design-system';
import { UniqueAsset } from '@rainbow-me/entities';

interface AttributeItemProps {
  color: string;
  disableMenu?: boolean;
  trait_type: string;
  slug: string;
  value: string | number;
}

const renderAttributeItem = ({
  color,
  disableMenu,
  trait_type: type,
  slug,
  value,
}: AttributeItemProps) =>
  type && value ? (
    <Tag
      color={color}
      disableMenu={disableMenu}
      key={`${type}${value}`}
      slug={slug}
      text={value}
      title={type}
    />
  ) : null;

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
  const sortedTraits = (sortList(
    traits,
    'trait_type',
    'asc'
  ) as typeof traits).map(trait => ({
    ...trait,
    color,
    disableMenu,
    slug,
  }));

  return <Inline space="10px">{sortedTraits.map(renderAttributeItem)}</Inline>;
};

export default magicMemo(UniqueTokenAttributes, ['color', 'slug', 'traits']);
